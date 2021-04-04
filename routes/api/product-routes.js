const router = require('express').Router();
const { Product, Category, Tag, ProductTag } = require('../../models');

// The `/api/products` endpoint

// find all products
router.get('/', async (req, res) => {
  // be sure to include its associated Category and Tag data
  try {
    const products = await Product.findAll({ 
      include: [
        { model: Category },
        { model: Tag, through: { ProductTag, attributes: [] } }
      ],
      attributes: { exclude: ['category_id'] },
      order: [
        ['id', 'asc'],                  // this orders first by Product.id
        [{ model: Tag }, 'id', 'asc']   // this orders second by Tag.id
      ]
    });
    res.status(200).json(products);

  } catch (err) {
    res.status(500).json(err);
  }
});


// find a single product by its `id`
router.get('/:id', async (req, res) => {
  // be sure to include its associated Category and Tag data
  try {
    const product = await Product.findByPk(req.params.id, { 
      include: [
        { model: Category },
        { model: Tag, through: { ProductTag, attributes: [] } }
      ],
      attributes: { exclude: ['category_id'] },
      order: [
        ['id', 'asc'],                  // this orders first by Product.id
        [{ model: Tag }, 'id', 'asc']   // this orders second by Tag.id
      ]
    });

    if (product != null) {
      res.status(200).json(product);
    } else {
      res.status(404).json({ message: `No product found with id: ${req.params.id}` });
    }    
  
  } catch (err) {
    res.status(500).json(err);
  }
});


// create new product
router.post('/', async (req, res) => {
  /* req.body should look like this...
    {
      product_name: "Basketball",
      price: 200.00,
      stock: 3,
      tagIds: [1, 2, 3, 4]
    }
  */
  try {
    var product = await Product.create(req.body);
    console.log(product.get({ plain: true }));

    // if there's product tags, we need to create pairings to bulk create in the ProductTag model
    if (product != null && req.body.tagIds != null && req.body.tagIds.length > 0) {
      const productTagIds = req.body.tagIds.map((tag_id) => ({ product_id: product.id, tag_id }));
      await ProductTag.bulkCreate(productTagIds);
    }

    product = await Product.findByPk(product.id, { 
      include: [
        { model: Category },
        { model: Tag, through: { ProductTag, attributes: [] } }
      ],
      attributes: { exclude: ['category_id'] },
      order: [
        ['id', 'asc'],                  // this orders first by Product.id
        [{ model: Tag }, 'id', 'asc']   // this orders second by Tag.id
      ]
    });

    res.status(200).json(product);

  } catch (err) {
    console.log(err);
    res.status(400).json(err);
  }
});


// update product
router.put('/:id', async (req, res) => {
  try {
    // update product table
    const [ isProductUpdated ] = await Product.update(req.body, { where: { id: req.params.id } });
    var deletedProductTagsCount = 0;
    var newProductTags = null;

    // update which tags are on this product
    if (req.body.tagIds != null && req.body.tagIds.length > 0) {
      // get current tag ids
      const productTags = await ProductTag.findAll({ where: { product_id: req.params.id } });
      const currentProductTagIds = productTags.map(({ tag_id }) => tag_id);
      
      // get new tag ids
      const newProductTagArray = req.body.tagIds
        .filter((tag_id) => !currentProductTagIds.includes(tag_id))
        .map((tag_id) => ({ product_id: req.params.id, tag_id }));

      // get tag ids to be deleted
      const deleteProductTagIds = currentProductTagIds
        .filter((tag_id) => !req.body.tagIds.includes(tag_id));

      // add and remove tag ids
      if (newProductTagArray != null && newProductTagArray.length > 0 || deleteProductTagIds != null && deleteProductTagIds.length > 0) {
        const updatedProductTags = await Promise.all([
          ProductTag.destroy({ where: { product_id: req.params.id, tag_id: deleteProductTagIds } }),
          ProductTag.bulkCreate(newProductTagArray)
        ]);

        deletedProductTagsCount = updatedProductTags[0];
        newProductTags = updatedProductTags[1];
      }
    }

    var result = { 
      isProductUpdated: isProductUpdated,
      deletedProductTagsCount: deletedProductTagsCount,
      newProductTags: newProductTags
    };
    res.json(result)

  } catch (err) {
    console.log(err);
    res.status(400).json(err);
  }
});


// delete one product by its `id` value
router.delete('/:id', async (req, res) => {
  try {
    const result = await Product.destroy({ where: { id: req.params.id } });

    if (result != 0) {
      res.status(200).json(result);
    } else {
      res.status(404).json({ message: `No product found with id: ${req.params.id}` });
    }

  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
