const express = require('express');
const router = express.Router();
const authRequired = require('../middleware/authRequired');
const validateBody = require('../middleware/validateBody');
const {
  findProfileItems,
  findAll,
  findBy,
  create,
  remove,
} = require('../globalDbModels');

const TABLE_NAME = 'users-carts';

// for testing purposes
router.get('/', async (req, res) => {
  const carts = await findAll(TABLE_NAME);
  res.status(200).json(carts);
});

// retrieve user's cart items
router.get('/:profile_id', authRequired, async (req, res) => {
  const { profile_id = '' } = req.params;

  try {
    const cartItems = await findProfileItems(TABLE_NAME, profile_id);

    if (cartItems.length) {
      res.status(200).json(cartItems);
    } else {
      res.status(404).json({
        message: `Could not find the specified profile`,
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: `Could not retrieve the user's cart at the moment`,
      error: err.message,
    });
  }
});

// add user's item to the cart
router.post('/', authRequired, validateBody, async (req, res) => {
  const { profile_id = '', product_id = 0 } = req.body;

  try {
    // check to see item already exists in cart
    const item = await findBy(TABLE_NAME, { profile_id, product_id });

    if (item) {
      res
        .status(500)
        .json({ message: 'The specified item already exists in the cart' });
    } else {
      const profile = await findBy('profiles', { id: profile_id });
      const product = await findBy('products', { id: product_id });

      if (profile && product) {
        await create(TABLE_NAME, { profile_id, product_id });
        res.status(201).json({ message: 'Item added to cart' });
      } else {
        res.status(404).json({
          message: 'Could not find the specified profile or product.',
        });
      }
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: `Could not add the item to user's cart at the moment`,
      error: err.message,
    });
  }
});

// remove an item from the user's cart
router.delete('/:profile_id/:product_id', authRequired, async (req, res) => {
  const { profile_id = '', product_id = 0 } = req.params;

  try {
    const item = await findBy(TABLE_NAME, { profile_id, product_id });

    if (item) {
      await remove(TABLE_NAME, { profile_id, product_id });
      res.status(200).json({ message: 'Cart item removed' });
    } else {
      res.status(404).json({
        message: 'Could not find the specified cart item',
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: `Could not remove the item from the user's cart at the moment`,
      error: err.message,
    });
  }
});

module.exports = router;
