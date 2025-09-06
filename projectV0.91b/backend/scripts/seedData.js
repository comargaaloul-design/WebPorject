const mongoose = require('mongoose');
const User = require('../models/User');
const Server = require('../models/Server');
const logger = require('../utils/logger');

// Pre-configured servers from your original script
const initialServers = [
  {
    hostname: 'siegedbc',
    ip: '10.0.0.1', // You'll need to replace with actual IPs
    port: 1521,
    description: 'Database server',
    group: 'database',
    isActive: true
  },
  {
    hostname: 'SiegeAssurnetFront',
    ip: '10.0.0.2',
    port: 80,
    description: 'Frontend web server',
    group: 'web',
    isActive: true
  },
  {
    hostname: 'droolslot2',
    ip: '10.0.0.3',
    port: 80,
    description: 'Drools server',
    group: 'api',
    isActive: true
  },
  {
    hostname: 'siegeawf',
    ip: '10.0.0.4',
    port: 80,
    description: 'AWF server',
    group: 'web',
    isActive: true
  },
  {
    hostname: 'siegeasdrools',
    ip: '10.0.0.5',
    port: 8080,
    description: 'AS Drools server',
    group: 'api',
    isActive: true
  },
  {
    hostname: 'siegeaskeycloak',
    ip: '10.0.0.6',
    port: 8080,
    description: 'Keycloak authentication server',
    group: 'auth',
    isActive: true
  },
  {
    hostname: 'siegeasbackend',
    ip: '10.0.0.7',
    port: 7001,
    description: 'Backend application server',
    group: 'api',
    isActive: true
  },
  {
    hostname: 'assurnetprod',
    ip: '10.0.0.8',
    port: 80,
    description: 'Production server',
    group: 'web',
    isActive: true
  },
  {
    hostname: 'SiegeAssurnetDigitale',
    ip: '10.0.0.9',
    port: 7002,
    description: 'Digital platform server',
    group: 'api',
    isActive: true
  }
];

const defaultAdmin = {
  username: 'admin',
  email: 'admin@example.com',
  password: 'admin123', // Change this in production
  role: 'admin',
  isActive: true
};

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/server-monitoring');
    logger.info('Connected to MongoDB for seeding');

    // Check if admin user exists
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (!existingAdmin) {
      const adminUser = new User(defaultAdmin);
      await adminUser.save();
      logger.info('Default admin user created');
      console.log('Default admin user created:');
      console.log('Username: admin');
      console.log('Password: admin123');
      console.log('Please change the password after first login!');
    } else {
      logger.info('Admin user already exists');
    }

    // Check if servers exist
    const existingServers = await Server.countDocuments();
    if (existingServers === 0) {
      await Server.insertMany(initialServers);
      logger.info(`${initialServers.length} initial servers created`);
      console.log('\nInitial servers created:');
      initialServers.forEach(server => {
        console.log(`- ${server.hostname} (${server.ip}:${server.port}) - ${server.group}`);
      });
      console.log('\nNote: Please update the IP addresses in the server management interface to match your actual infrastructure.');
    } else {
      logger.info('Servers already exist in database');
    }

    await mongoose.disconnect();
    logger.info('Database seeding completed');
    console.log('\nDatabase seeding completed successfully!');

  } catch (error) {
    logger.error('Error seeding database:', error);
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;