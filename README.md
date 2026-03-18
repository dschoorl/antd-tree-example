# Demo

This repository complements the blogpost at https://redstardevelopment.nl/en/Blog/antd-tree-drag-and-drop by supplying code to demonstrate the working of allowDrop and onDrop in Ant Design's Tree Component.

To run this code on your local machine, you need a recent version of node and npm installed and run the following commands from the command line:

```
git clone https://github.com/dschoorl/antd-tree-example.git
cd antd-tree-example
npm install
npm run dev
```

If all goes well, your default browser will open and point at the address of the application: http://localhost:3000.

You will see a tree structure with three types of nodes, each with a different background color. They are:

- back- and front matter (with red background)
- containers (with black background).
- scenes (withgrey background)

The business rules implemented for drag-and-drop are simple: a container can only contain scenes or containers. The root of the tree can only contain back- and front matter and containers.

Play around and check the code to see how these rules are implemented. This will demonstrate what is discussed in the above mentioned blog post.

If you don't want this code on your machine, you can run the application in a sandboxed environment on the internet at: https://stackblitz.com/~/github.com/dschoorl/antd-tree-example
