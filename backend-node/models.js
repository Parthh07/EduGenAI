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
  total_questions: { type: DataTypes.INTEGER, allowNull: false },
  exam_type: { type: DataTypes.STRING(20), defaultValue: 'MCQ' },
  difficulty: { type: DataTypes.STRING(20), defaultValue: 'medium' }
}, { tableName: 'exams', timestamps: true });

const ChatSession = sequelize.define('ChatSession', {
  id: { type: DataTypes.STRING(64), primaryKey: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: User, key: 'id' } },
  title: { type: DataTypes.STRING(255), allowNull: false },
  history_json: { type: DataTypes.TEXT, allowNull: false }
}, { tableName: 'chat_sessions', timestamps: true });

const Flashcard = sequelize.define('Flashcard', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: User, key: 'id' } },
  question: { type: DataTypes.TEXT, allowNull: false },
  answer: { type: DataTypes.TEXT, allowNull: false },
  source: { type: DataTypes.STRING(500), defaultValue: '' },
  ease_factor: { type: DataTypes.FLOAT, defaultValue: 2.5 },
  interval: { type: DataTypes.INTEGER, defaultValue: 0 },
  next_review: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  review_count: { type: DataTypes.INTEGER, defaultValue: 0 }
}, { tableName: 'flashcards', timestamps: true });

const PasswordReset = sequelize.define('PasswordReset', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: User, key: 'id' } },
  otp_hash: { type: DataTypes.STRING(255), allowNull: false },
  expires_at: { type: DataTypes.DATE, allowNull: false },
  used: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { tableName: 'password_resets', timestamps: true });

User.hasMany(Exam, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Exam.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(ChatSession, { foreignKey: 'user_id', onDelete: 'CASCADE' });
ChatSession.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Flashcard, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Flashcard.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(PasswordReset, { foreignKey: 'user_id', onDelete: 'CASCADE' });
PasswordReset.belongsTo(User, { foreignKey: 'user_id' });

module.exports = { sequelize, User, Exam, ChatSession, Flashcard, PasswordReset };
