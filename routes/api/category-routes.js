const router = require('express').Router();
const { Product, Category, Tag, ProductTag } = require('../../models');

// The `/api/categories` endpoint

// // FOR FUTURE REFERENCE
// // Combine getting all categories and getting category by id in the same route, based on message body
// router.get('/', async (req, res) => {
//   try {
//
//     // find all categories
//     if (req.body.id == null) {
//       const categories = await Category.findAll({ include: [{ model: Product }], order: [['id', 'asc']] });
//       res.status(200).json(categories);
//     }
//
//     // find one category by its `id` value
//     else {
//       const result = await Category.findByPk(req.body.id, { include: [{ model: Product }] });
//
//       if (result != null) {
//         res.status(200).json(result);
//       } else {
//         res.status(404).json({ message: `No category found with id: ${req.body.id}` });
//       } 
//     }
//
//   } catch (err) {
//     res.status(500).json(err);
//   }
// });


// find all categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.findAll({
      include: [{ model: Product,
        include: [{ model: Tag, through: { ProductTag, attributes: [] } }],
        attributes: { exclude: ['category_id'] }
      }],
      order: [
        ['id', 'asc'],                                     // this orders first by Category.id
        [{ model: Product }, 'id', 'asc'],                 // this orders second by Product.id
        [{ model: Product }, { model: Tag }, 'id', 'asc']] // this orders third by Tag.id
    });
    res.status(200).json(categories);

  } catch (err) {
    res.status(500).json(err);
  }
});


// find one category by its `id` value
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id, { 
      include: [{ model: Product,
        include: [{ model: Tag, through: { ProductTag, attributes: [] } }],
        attributes: { exclude: ['category_id'] }
      }],
      order: [
        [{ model: Product }, 'id', 'asc'],                 // this orders first by Product.id
        [{ model: Product }, { model: Tag }, 'id', 'asc']] // this orders second by Tag.id
    });

    if (category != null) {
      res.status(200).json(category);
    } else {
      res.status(404).json({ message: `No category found with id: ${req.params.id}` });
    }    
  
  } catch (err) {
    res.status(500).json(err);
  }
});


// create a new category
router.post('/', async (req, res) => {
  try {
    const category = await Category.create(req.body);
    res.status(200).json(category);
  
  } catch (err) {
    res.status(400).json(err);
  }
});


// update a category by its `id` value
router.put('/:id', async (req, res) => {
  try {
    const result = await Category.update(req.body, { where: { id: req.params.id } });
    res.status(200).json(result);

  } catch (err) {
    res.status(500).json(err);
  }
});


// delete a category by its `id` value
router.delete('/:id', async (req, res) => {
  try {
    const result = await Category.destroy({ where: { id: req.params.id } });

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
