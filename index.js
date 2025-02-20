require("dotenv").config();
const express = require("express");
const app = express();
const port = 3000;
const { MongoClient, ServerApiVersion } = require("mongodb");
const cors = require("cors");
const { ObjectId } = require("mongodb");

//middleware
app.use(cors());
app.use(express.json());

// mongodb starts

// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yizt2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yizt2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
console.log(uri);
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });

    const taskCollection = client.db("task-pilot-db").collection("tasks");

    app.post("/tasks", async (req, res) => {
      try {
        const { title, description, category = "To-Do", email } = req.body;

        if (!title || !description || !email) {
          return res
            .status(400)
            .json({ message: "Title, Description, and Email are required" });
        }

        const newTask = {
          title,
          description,
          timestamp: new Date(), // Auto-generated timestamp
          category, // Default is "To-Do"
          email, // Logged-in user's email
        };

        const taskResult = await taskCollection.insertOne(newTask);
        res.status(201).json(taskResult);
      } catch (error) {
        console.error("Error creating task:", error);
        res.status(500).json({ message: "Internal Server Error" });
      }
    });

    // GET /tasks - Retrieve all tasks for the logged-in user
    app.get("/tasks", async (req, res) => {
      try {
        const { email } = req.query; // Assuming email is sent as a query parameter

        if (!email) {
          return res
            .status(400)
            .json({ message: "Email is required to fetch tasks" });
        }

        const tasks = await taskCollection.find({ email }).toArray();
        res.status(200).json(tasks);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).json({ message: "Internal Server Error" });
      }
    });

    // PUT /tasks/:id - Update task details (title, description, category)
    app.put("/tasks/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const { title, description, category } = req.body;

        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ message: "Invalid task ID" });
        }

        const updateFields = {};
        if (title) updateFields.title = title;
        if (description) updateFields.description = description;
        if (category) updateFields.category = category;

        const result = await taskCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updateFields }
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ message: "Task not found" });
        }

        res.status(200).json({ message: "Task updated successfully" });
      } catch (error) {
        console.error("Error updating task:", error);
        res.status(500).json({ message: "Internal Server Error" });
      }
    });

    // DELETE /tasks/:id - Delete a task
    app.delete("/tasks/:id", async (req, res) => {
      try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ message: "Invalid task ID" });
        }

        const result = await taskCollection.deleteOne({
          _id: new ObjectId(id),
        });

        if (result.deletedCount === 0) {
          return res.status(404).json({ message: "Task not found" });
        }

        res.status(200).json({ message: "Task deleted successfully" });
      } catch (error) {
        console.error("Error deleting task:", error);
        res.status(500).json({ message: "Internal Server Error" });
      }
    });
    // app.post("/tasks", async (req, res) => {
    //   const task = req.body;
    //   const taskResult = await taskCollection.insertOne(task);
    //   // res.send({ paymentResult });
    //   res.send(taskResult);
    // });

    app.get("/", (req, res) => {
      res.send("Hellos World!");
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// mongodb ends

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
