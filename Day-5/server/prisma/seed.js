const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const students = [
  { firstName: 'Aarav', lastName: 'Sharma', email: 'aarav.sharma@example.com', phone: '9876543210', dateOfBirth: new Date('2002-05-15'), gender: 'Male', course: 'B.Tech CSE', enrollmentYear: 2023, status: 'active' },
  { firstName: 'Priya', lastName: 'Patel', email: 'priya.patel@example.com', phone: '9876543211', dateOfBirth: new Date('2001-08-22'), gender: 'Female', course: 'B.Tech CSE', enrollmentYear: 2022, status: 'active' },
  { firstName: 'Rohan', lastName: 'Verma', email: 'rohan.verma@example.com', phone: '9876543212', dateOfBirth: new Date('2003-01-10'), gender: 'Male', course: 'B.Tech ECE', enrollmentYear: 2024, status: 'active' },
  { firstName: 'Ananya', lastName: 'Singh', email: 'ananya.singh@example.com', phone: '9876543213', dateOfBirth: new Date('2000-11-30'), gender: 'Female', course: 'B.Sc Mathematics', enrollmentYear: 2021, status: 'graduated' },
  { firstName: 'Karthik', lastName: 'Nair', email: 'karthik.nair@example.com', phone: '9876543214', dateOfBirth: new Date('2002-07-18'), gender: 'Male', course: 'B.Tech CSE', enrollmentYear: 2023, status: 'active' },
  { firstName: 'Sneha', lastName: 'Reddy', email: 'sneha.reddy@example.com', phone: '9876543215', dateOfBirth: new Date('2001-03-25'), gender: 'Female', course: 'B.Com', enrollmentYear: 2022, status: 'inactive' },
  { firstName: 'Arjun', lastName: 'Menon', email: 'arjun.menon@example.com', phone: '9876543216', dateOfBirth: new Date('2003-09-05'), gender: 'Male', course: 'B.Tech ME', enrollmentYear: 2024, status: 'active' },
  { firstName: 'Divya', lastName: 'Gupta', email: 'divya.gupta@example.com', phone: '9876543217', dateOfBirth: new Date('2002-12-12'), gender: 'Female', course: 'B.Tech CSE', enrollmentYear: 2023, status: 'active' },
  { firstName: 'Vikram', lastName: 'Rao', email: 'vikram.rao@example.com', phone: '9876543218', dateOfBirth: new Date('2000-06-20'), gender: 'Male', course: 'BCA', enrollmentYear: 2021, status: 'graduated' },
  { firstName: 'Meera', lastName: 'Joshi', email: 'meera.joshi@example.com', phone: '9876543219', dateOfBirth: new Date('2003-04-08'), gender: 'Female', course: 'B.Tech IT', enrollmentYear: 2024, status: 'active' },
  { firstName: 'Aditya', lastName: 'Kumar', email: 'aditya.kumar@example.com', phone: '9876543220', dateOfBirth: new Date('2001-10-15'), gender: 'Male', course: 'B.Tech CSE', enrollmentYear: 2022, status: 'active' },
  { firstName: 'Nisha', lastName: 'Desai', email: 'nisha.desai@example.com', phone: '9876543221', dateOfBirth: new Date('2002-02-28'), gender: 'Female', course: 'B.Sc Physics', enrollmentYear: 2023, status: 'active' },
];

async function main() {
  console.log('Seeding database...');
  for (const student of students) {
    await prisma.student.upsert({
      where: { email: student.email },
      update: {},
      create: student,
    });
  }
  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
