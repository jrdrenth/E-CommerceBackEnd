require('dotenv').config();

const Sequelize = require('sequelize');

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    port: process.env.DB_PORT,
    
    // Prevents mysql2 from converting decimal to string to preserve precision,
    // we will not run into precision issues so it's ok to opt out of this default behavior
    dialectOptions: { decimalNumbers: true }
  }
);

module.exports = sequelize;
