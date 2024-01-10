import express from "express";
import colors from "colors";
import dotenv from "dotenv";
import morgan from "morgan";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoute.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cors from "cors";
import stripePackage from 'stripe';
import orderModel from './models/orderModel.js'
import path from 'path'
import { fileURLToPath } from 'url'
//configure env
dotenv.config();

//databse config
connectDB();


const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

//rest object
const app = express();

const stripe = stripePackage('sk_test_51MVyK1SAlsdXfF3nHcoFOqEWuWhGwVLBZz2VTGpHvLdtsydt3Op04xip6EDxdcHgXW2UF1wrK4yc86ETDaQu1D8a00S3FQrvIw');

//middelwares
app.use(cors());

app.use(express.static("public"));
app.use(express.json());
app.use(morgan("dev"));


app.use(express.static(path.join(__dirname, './client/build')))


//routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/category", categoryRoutes);
app.use("/api/v1/product", productRoutes);


app.use('*', function (req, res) {
  res.sendFile(path.join(__dirname, './client/build/index.htnl'))
})

//rest api
app.get("/", (req, res) => {
  res.send("<h1>Welcome to ecommerce app</h1>");
});

//PORT
const PORT = process.env.PORT || 8080;

//run listen
app.listen(PORT, () => {
  console.log(
    `Server Running on ${process.env.DEV_MODE} mode on port ${PORT}`.bgCyan
      .white
  );
});




app.post("/checkout", async (req, res) => {
  /*
      req.body.items
      [
          {
                 id:1,
                 quantityr:3 
          }
      ]
      stripe wants to process payment
      [
          {
              price:1,
              quantity:3
          }
      ]



   */

  const products = req.body.items;
  const productsArray = [



    {
      id: "price_1MszlvSAlsdXfF3n2U1XX6rE",
      name: "BedBugs Control",
      price: 130,
    },
    {
      id: "price_1MszqESAlsdXfF3n7RPSXwgL",
      name: "Chimney Repair",
      price: 200,
    },
    {
      id: "price_1MtmgrSAlsdXfF3nhTxBYcju",
      name: "car disinfection",
      price: 600,
    },
    {
      id: "price_1MtmnvSAlsdXfF3njmG4lVsq",
      name: "WaterProofing",
      price: 250,
    },
    {
      id: "price_1MtmqPSAlsdXfF3ns7OVHcMP",
      name: "Termite Conttol",
      price: 400,
    },
    {
      id: "price_1MtmtNSAlsdXfF3n4CLGCZcD",
      name: "Bunglaw Disinfection",
      price: 500,
    },
  ];
  const mergedProducts = {};

  products.forEach((product) => {
    if (product._id in mergedProducts) {
      mergedProducts[product._id].quantity += 1;
    } else {
      mergedProducts[product._id] = {
        _id: product._id,
        name: product.name,
        quantity: 1,
      };
    }
  });

  const mergedList = Object.values(mergedProducts);

  mergedList.forEach((product) => {
    const matchingProduct = productsArray.find((p) => p.name === product.name);
    if (matchingProduct) {
      product._id = matchingProduct.id;
    }
  });

  const items = mergedList;

  let lineitems = []
  items.forEach((item) => {
    lineitems.push({

      price: item._id,
      quantity: item.quantity
    })
  });
  //stripe checkout session
  console.log(req.body)
  const session = await stripe.checkout.sessions.create(
    {
      line_items: lineitems,
      mode: 'payment',
      success_url: 'http://localhost:3000/dashboard/user/orders',
      cancel_url: 'http://localhost:3000/cancel'
    });

  const order = await new orderModel({
    products: req.body.items.map((item) => item._id),
    payment: { success: true },
    buyer: req.body.user._id,
  }).save();


  res.send(JSON.stringify({
    url: session.url
  }))
})
