const {Router} = require("express");
const purchaseRouter = Router();
const {handleUserPurchase} = require("../../controllers/purchase");

purchaseRouter.post("/", handleUserPurchase)

module.exports = {
    purchaseRouter
}