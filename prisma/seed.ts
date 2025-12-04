import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // 기존 데이터 삭제
  await prisma.menuItem.deleteMany();

  // ----- Drink 10개 -----
  const drinks = [
    {
      name: "베트남 연유 커피",
      description: "진한 드립 커피에 달콤한 연유",
      image: "/images/drink1.jpg",
      category: "drink",
      stock: 7,
    },
    {
      name: "아이스 연유 커피",
      description: "차갑게 즐기는 연유 커피",
      image: "/images/drink2.jpg",
      category: "drink",
      stock: 10,
    },
    {
      name: "라임 소다",
      description: "상큼한 라임향 탄산수",
      image: "/images/drink3.jpg",
      category: "drink",
      stock: 5,
    },
    {
      name: "패션후르츠 소다",
      description: "과일향이 풍부한 달콤 상큼 소다",
      image: "/images/drink4.jpg",
      category: "drink",
      stock: 8,
    },
    {
      name: "망고 스무디",
      description: "부드러운 망고 과일 스무디",
      image: "/images/drink5.jpg",
      category: "drink",
      stock: 4,
    },
    {
      name: "바나나 스무디",
      description: "달콤한 바나나 풍미 가득",
      image: "/images/drink6.jpg",
      category: "drink",
      stock: 9,
    },
    {
      name: "코코넛 밀크 커피",
      description: "부드럽고 고소한 코코넛 커피",
      image: "/images/drink7.jpg",
      category: "drink",
      stock: 6,
    },
    {
      name: "복숭아 아이스티",
      description: "달콤하고 시원한 복숭아 향",
      image: "/images/drink8.jpg",
      category: "drink",
      stock: 12,
    },
    {
      name: "레몬 아이스티",
      description: "깔끔하고 상큼한 아이스티",
      image: "/images/drink9.jpg",
      category: "drink",
      stock: 11,
    },
    {
      name: "얼그레이 밀크티",
      description: "풍미 깊은 얼그레이 향",
      image: "/images/drink10.jpg",
      category: "drink",
      stock: 3,
    },
  ];

  // ----- Food 2개 -----
  const foods = [
    {
      name: "Phở bò",
      description: "소고기와 쌀국수, 향신채가 들어간 따뜻한 국수",
      image: "/images/food1.jpg",
      category: "food",
      stock: 9,
    },
    {
      name: "Bún bò Huế",
      description: "매콤한 육수에 소고기와 쌀국수가 들어간 후에 스타일 국수",
      image: "/images/food2.jpg",
      category: "food",
      stock: 1,
    },
  ];

  await prisma.menuItem.createMany({
    data: [...drinks, ...foods],
  });

  console.log("🌱 Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });