const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false }
  },
  logging: false
});

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING(80), unique: true, allowNull: false },
  email: { type: DataTypes.STRING(120), unique: true, allowNull: false },
  password_hash: { type: DataTypes.STRING(128), allowNull: false }
}, { tableName: 'users', timestamps: true });

const Exam = sequelize.define('Exam', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: User, key: 'id' } },
  score: { type: DataTypes.INTEGER, allowNull: false },
  total_questions: { type: DataTypes.INTEGER, allowNull: false }
}, { tableName: 'exams', timestamps: true });

const ChatSession = sequelize.define('ChatSession', {
  id: { type: DataTypes.STRING(64), primaryKey: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: User, key: 'id' } },
  title: { type: DataTypes.STRING(255), allowNull: false },
  history_json: { type: DataTypes.TEXT, allowNull: false }
}, { tableName: 'chat_sessions', timestamps: true });

User.hasMany(Exam, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Exam.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(ChatSession, { foreignKey: 'user_id', onDelete: 'CASCADE' });
ChatSession.belongsTo(User, { foreignKey: 'user_id' });

module.exports = { sequelize, User, Exam, ChatSession };
