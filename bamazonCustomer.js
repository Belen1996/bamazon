//
// 1. Connect to MySQL (x)
// 2. List of all products (x)
// 3. Get user input for product to buy (x)
// 4. Get user input for product quantity to buy (x)
// 5. Check inventory: if desired quantity is <= existing quantity -> show price and update DB ()
//                     if desired quantity is > existing quantity -> show error message (x)
//

var mysql = require("mysql");
var columnify = require('columnify')
var readline = require('readline');
let rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '> '
});


const LIST_PRODUCTS = "SELECT * FROM bamazon.products;";

var connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "bamazon",
  password: "bamazon",
  database: "bamazon"
});

connection.connect(function(err) {
  if (err) {
    throw err;
  } else {
    console.info('\nPlease select a product from the list by ITEM_ID (-1 to exit):\n');
    getProductList(connection, printProductsAndTakeUserSelection);
  }
});

function selectQuantityAndUpdateProductCallback(connection, product) {
  console.info('Please enter the quantity to buy (-1 to exit): ');
  rl.prompt();
  
  rl.on('line', (line) => {
    switch (line.trim()) {
      case '-1':
        console.info("Exiting...");
        process.exit(0);
        break;      
      default:
        let quantity = parseInt(line);
        if(quantity === NaN || quantity <= 0) {
          console.error("Please enter a valid number");
        } else {
          if(product.stock_quantity < quantity) {
            console.error("Not enough items in stock. Only " + product.stock_quantity + " items are available");
            console.error("Please enter a valid quantity to buy");
          } else {
            let total_price = quantity * product.price;
            let total_sales = product.product_sales + total_price;
            let remaining_stock = product.stock_quantity - quantity;
            connection.query("UPDATE bamazon.products SET stock_quantity = "+ remaining_stock + ", product_sales = " + total_sales + " WHERE item_id = " + product.item_id, function (err) {
              if(err) {
                throw err;
                //console.error("Error while updating inventory. Could not process sale.");
                //process.exit(0);    
              } else {
                console.info("The total cost is: " + total_price);
                console.info("Thanks for buying at Bamazon!");
                process.exit(0);    
              }
            });
          }
        }
        break;
      }
  }).on('close', () => {
    console.log('Have a great day!');
    process.exit(0);
  });   
} 

function printProductsAndTakeUserSelection(connection, products, selectQuantityAndUpdateProductCallback) {
  console.info(columnify(products));  
  rl.prompt();
  
  rl.on('line', (line) => {
    switch (line.trim()) {
      case '-1':
        console.info("Exiting...");
        process.exit(0);
        break;      
      default:
        let itemId = parseInt(line);
        if(itemId === NaN || !(products.find(x => x.item_id === itemId))) {
          console.error("Please enter an Item ID from the given listing (-1 to exit): \n");
          console.info(columnify(products));
        } else {
          let product = products.find(x => x.item_id === itemId);
          selectQuantityAndUpdateProductCallback(connection, product);
        }
        break;
      }
  }).on('close', () => {
    console.log('Have a great day!');
    process.exit(0);
  });  
}

function getProductList(connection, resultsCallback) {
  connection.query(LIST_PRODUCTS, function(error, result) {
    if(error) {
      throw error;
    } else {
      resultsCallback(connection, result, selectQuantityAndUpdateProductCallback);
    }
  });
}