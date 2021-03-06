const router = require('express').Router();
const { Product, Category, Tag, ProductTag } = require('../../models');

// The `/api/tags` endpoint


// find all tags
router.get('/', async (req, res) => {
  // be sure to include its associated Product data
  try {
    const tags = await Tag.findAll({ 
      include: [{
        model: Product,
        include: [{ model: Category }], through: { ProductTag, attributes: [] },
        attributes: ['id', 'product_name']}
      ],
      order: [
        ['id', 'asc'],                     // this orders first by Tag.id
        [{ model: Product }, 'id', 'desc'] // this orders second by Product.id
      ]
    });
    
    // The folloing line shows how to do deep nesting with "include:"
    //const tags = await Tag.findAll({ include: [{ model: Product, include: { model: Tag, include: Product } }], order: [['id', 'asc']] });
    
    res.status(200).json(tags);
  } catch (err) {
    res.status(500).json(err);
  }
});


// find a single tag by its `id`
router.get('/:id', async (req, res) => {
  // be sure to include its associated Product data
  try {
    const tag = await Tag.findByPk(req.params.id, {
      include: [{
        model: Product, 
        include: [{ model: Category }], through: { ProductTag, attributes: [] },
        attributes: ['id', 'product_name']}
      ],
      //attributes: { exclude: ['id']} }], // this syntax can be used to exclude attributes
      order: [[{ model: Product }, 'id', 'asc']]
    });

    if (tag != null) {
      res.status(200).json(tag);
    } else {
      res.status(404).json({ message: `No tag found with id: ${req.params.id}` });
    }

  } catch (err) {
    res.status(500).json(err);
  }

});


// create a new tag
router.post('/', async (req, res) => {
  try {
    var tag = await Tag.create(req.body);

    // if there are products to be tagged with the new tag, create product_id-tag_id pairs to insert into the ProductTag table
    // productIds contains list of ids of products to be tagged
    if (tag != null && req.body.productIds != null && req.body.productIds.length > 0) {
      const productIds = await Product.findAll({ attributes: ['id'], where: { id: req.body.productIds } });
      //console.log(productIds.map(productId => productId.get({ plain: true })));

      const taggedProducts = productIds.map(({ id }) => ({
        product_id: id,
        tag_id: tag.id
      }));

      await ProductTag.bulkCreate(taggedProducts);
      tag = await Tag.findByPk(tag.id, {// include: [{ model: Product, through: ProductTag }] });
        include: [{
          model: Product, include: [{ model: Category }], through: { ProductTag, attributes: [] },
          attributes: ['id', 'product_name']}
        ],
        order: [[{ model: Product }, 'id', 'asc']]
      });
    }

    // taggedProducts contains list of names of products to be tagged
    if (tag != null && req.body.taggedProducts != null && req.body.taggedProducts.length > 0) {
      const products = await Product.findAll({ where: { product_name: req.body.taggedProducts }});
      //console.log(products.map(product => product.get({ plain: true })));
      
      const taggedProducts = products.map(({ id }) => ({
        product_id: id,
        tag_id: tag.id
      }));
      await ProductTag.bulkCreate(taggedProducts);
      //tag = await Tag.findByPk(tag.id, { include: [{ model: Product, through: ProductTag }], order: [[{ model: Product}, 'id', 'asc']] });
      tag = await Tag.findByPk(tag.id, {
        include: [{
          model: Product, include: [{ model: Category }], through: { ProductTag, attributes: [] },
          attributes: ['id', 'product_name']}
        ],
        order: [[{ model: Product }, 'id', 'asc']]
      });
    }

    res.status(200).json(tag);
  
  } catch (err) {
    res.status(400).json(err);
  }
});


// update a tag by its `id` value
router.put('/:id', async (req, res) => {
  try {
    // update product table
    const [ isTagUpdated ] = await Tag.update(req.body, { where: { id: req.params.id } });
    var deletedProductTagsCount = 0;
    var newProductTags = null;

    // update which products this tag is on
    if (req.body.productIds != null && req.body.productIds.length > 0) {
      // get current product ids
      const productTags = await ProductTag.findAll({ where: { tag_id: req.params.id } });
      const currentTaggedProductIds = productTags.map(({ product_id }) => product_id);
      
      // get new product ids
      const newProductTagArray = req.body.productIds
        .filter((product_id) => !currentTaggedProductIds.includes(product_id))
        .map((product_id) => ({ product_id, tag_id: req.params.id }));
      
      console.log('currentTaggedProductIds:');
      console.log(currentTaggedProductIds);

      console.log('newProductTagArray:');
      console.log(newProductTagArray);

      // get product ids to be deleted
      const deleteTaggedProductIds = currentTaggedProductIds
        .filter((product_id) => !req.body.productIds.includes(product_id));
      
      console.log('deleteTaggedProductIds:');
      console.log(deleteTaggedProductIds);

      // add and remove product ids
      if (newProductTagArray != null && newProductTagArray.length > 0 || deleteTaggedProductIds != null && deleteTaggedProductIds.length > 0) {
        const updatedProductTags = await Promise.all([
          ProductTag.destroy({ where: { product_id: deleteTaggedProductIds, tag_id: req.params.id } }),
          ProductTag.bulkCreate(newProductTagArray)
        ]);

        deletedProductTagsCount = updatedProductTags[0];
        newProductTags = updatedProductTags[1];
      }
    }

    var result = { 
      isTagUpdated: isTagUpdated,
      deletedProductTagsCount: deletedProductTagsCount,
      newProductTags: newProductTags
    };
    res.json(result)

  } catch (err) {
    console.log(err);
    res.status(400).json(err);
  }
});


// delete on tag by its `id` value
router.delete('/:id', async (req, res) => {
  try {
    const result = await Tag.destroy({ where: { id: req.params.id } });

    if (result != 0) {
      res.status(200).json(result);
    } else {
      res.status(404).json({ message: `No category found with id: ${req.params.id}` });
    }

  } catch (err) {
    res.status(500).json(err);
  }
  
});

module.exports = router;
