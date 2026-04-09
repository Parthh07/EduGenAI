require('dotenv').config();
const { sequelize } = require('./models');

async function testConnection() {
  try {
    console.log('Testing DB connection...');
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    
    console.log('Running sync...');
    await sequelize.sync({ alter: true });
    console.log('Sync complete.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  } finally {
    process.exit();
  }
}

testConnection();
