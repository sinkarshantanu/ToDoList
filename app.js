//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const dotenv = require("dotenv").config();

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

//Contents in env file sholud not have spave within the variable and assigned value
const MHOST = process.env.H_HOST;
const MADMIN = process.env.H_ADMIN;
const MPASSWORD = process.env.H_PASSWORD;

mongoose.connect("mongodb+srv://" + MADMIN + ":" + MPASSWORD + "@cluster0.to3thbg." + MHOST + "/todolistDB");

/*Item Schema*/
const itemsSchema = ({
  name: String
});
const Item = mongoose.model("Item", itemsSchema); //Mongoose Model

/*Creating already adding items*/
const item1 = new Item({
  name: "Buy Food"
});
const item2 = new Item({
  name: "Cook Food"
});
const item3 = new Item({
  name: "Eat Food"
});

/* Setting default array*/
const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema] //new items when added for every item
};
const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  /* Displays found items */
  Item.find({}, function(err, foundItems) {
    /* If array is empty add defaultItems */
    if (foundItems.length === 0) {
      /* Inserting default array*/
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err)
        } else {
          console.log("Succed to adding already made item array")
        }
      });
      res.render("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems
      });
    }
  });
});

app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });

  /* Creating new list and saving the items in it */
  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({
      name: listName
    }, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox; // Gets deleted item name
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (!err) {
        console.log("Deleted item that was checked");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {
        items: {
          _id: checkedItemId
        }
      }
    }, function(err, foundList) {
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }
});

app.get('/:customListName', function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({
    name: customListName
  }, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        //Create new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save();
        res.redirect("/" + customListName);
      } else {
        //Show existing list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      }
    }
  });
});

app.get("/about", function(req, res) {
  res.render("about");
});

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});

