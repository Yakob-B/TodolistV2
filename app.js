const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const express = require("express");
const _ = require("lodash");

const app = express();

mongoose.connect("mongodb+srv://yakoba:mongocluster@cluster0.yzelo.mongodb.net/TodolistDB?retryWrites=true&w=majority&appName=Cluster0");

const ItemSchema = {
    name: String
}
const Item = mongoose.model("Item", ItemSchema);

const item1 = new Item({
    name: "Welcome to your todolist!"
});
const item2 = new Item({
    name: "Hit + button to add new item!"
});
const item3 = new Item({
    name: "<-- Hit this Button to delete item"
});
const DefaultItems = [item1, item2, item3];
// create schema for custom list
const listSchema = {
    name: String,
    items: [ItemSchema]
}
// create model for list schema 

const List = mongoose.model("List", listSchema);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.set('view engine', 'ejs');
// adding new item
app.post("/", function (req, res) {
    let itemName = req.body.newItem;
    const listName = req.body.list
    const itemAdd = new Item({
        name: itemName
    });
    if (listName === "Today") {
        itemAdd.save();

        res.redirect("/");
    } else {
        List.findOne({ name: listName })
            .then(foundItems => {
                if (foundItems) {
                    foundItems.items.push(itemAdd);
                    foundItems.save().then(() => {
                        res.redirect("/" + listName);
                    }).catch(err => {
                        console.error("Error saving the item:", err);
                    });
                } else {
                    console.error("List not found");
                }
            })
            .catch(err => {
                console.error("Error finding the list:", err);
            });

    }
});

app.post("/delete", async (req, res) => {
    const checkedBoxId = req.body.checkbox; // Corrected typo
    const listName = req.body.listName;

    if (listName === "Today") {
        // Check the correct variable `listName`
        try {
            await Item.findByIdAndDelete(checkedBoxId); // Delete the item from the `Item` model
            console.log("Successfully deleted checked item");
            res.redirect("/");
        } catch (error) {
            console.error("Error deleting item:", error);
        }
    } else {
        try {
            // Find the list and update it by pulling the item from its `items` array
            await List.findOneAndUpdate(
                { name: listName },
                { $pull: { items: { _id: checkedBoxId } } }
            );
            console.log("Successfully updated list by removing the item");
            res.redirect("/" + listName);
        } catch (error) {
            console.error("Error updating list:", error);
        }
    }
});

app.get("/", function (req, res) {
    async function run() {
        try {
            const items = await Item.find({});
            if (items.length == 0) {
                Item.insertMany(DefaultItems)
                    .then((docs) => {
                        console.log("Successfully inserted:", docs);
                    })
                    .catch((err) => {
                        console.error("Error inserting users:", err);
                    });
                res.redirect("/");

            } else {
                res.render("list", { ListTitle: "Today", newItem: items });
            }

        } catch (err) {
            console.error("Error fetching items:", err);
        }
    }

    run();

});
app.get("/:customList", async (req, res) => {
    const customListName = _.capitalize(req.params.customList);
    try {
        const result = await List.findOne({ name: customListName })
        if (!result) {
            // create the list
            const list = new List({
                name: customListName,
                items: DefaultItems
            });

            list.save();
        } else {
            // show the list
            res.render("list", { ListTitle: result.name, newItem: result.items });
        }

    } catch (error) {
        console.log(error);

    }

});
app.get("/about", function (req, res) {
    res.render("about");

})

const PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
    console.log("Server started at port 3000 Or" + PORT);
});