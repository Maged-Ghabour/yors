const db = require("./core/db.js");
const { UserType } = require("./prisma/generated/prisma/index.js");

async function main() {
  console.log("Starting seeding..");

  const schools = [];
  const parents = [];

  // إنشاء ٥ مدارس
  for (let i = 1; i <= 5; i++) {
    const school = await db.user.create({
      data: {
        email: `school${i}@example.com`,
        name: `مدرسة ${i}`,
        password: "123",
        phone: `050000000${i}`,
        userType: UserType.SCHOOL,
      },
    });
    schools.push(school);
  }

  // إنشاء ٥ أولياء أمور
  for (let i = 1; i <= 5; i++) {
    const parent = await db.user.create({
      data: {
        email: `parent${i}@example.com`,
        name: `ولي أمر ${i}`,
        phone: `00${i}`,
        nationalNumber: `00${i}`,
        userType: UserType.PARENT,
      },
    });
    parents.push(parent);
  }

  // إنشاء ٥ طلاب لكل مدرسة
  for (const school of schools) {
    for (let i = 1; i <= 5; i++) {
      await db.student.create({
        data: {
          name: `طالب ${i} في ${school.name}`,
          schoolId: school.id,
          parentId: parents[i - 1].id,
          nationalNumber: `000${i}`,
        },
      });
    }
  }

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("An error while seeding:", e);
  })
  .finally(async () => {
    await db.$disconnect();
  });
