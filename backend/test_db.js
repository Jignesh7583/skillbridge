const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function test() {
  try {
    const hashedPassword = await bcrypt.hash('test123', 10);
    const user = await prisma.user.create({
      data: {
        name: 'TestUser',
        email: 'debug@test.com',
        password: hashedPassword,
        role: 'STUDENT'
      }
    });
    console.log('SUCCESS:', user);
  } catch (e) {
    console.error('ERROR:', e.message || e);
  }
}

test();
