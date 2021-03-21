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

// update a tag's name by its `id` value
router.put('/:id', (req, res) => {

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
