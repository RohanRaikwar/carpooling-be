import { prisma } from './src/config/index.js';

async function main() {
    const users = await prisma.user.findMany();
    console.log('Users in DB:', users.length);
    users.forEach(u => console.log(`- ${u.id}: ${u.email}`));
    process.exit(0);
}

main();
