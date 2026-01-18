import { PrismaClient, UserRole, FreightType, CustomerTier, ProductType, RateType } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed...");

  // Create admin user
  const adminPassword = await hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@nusaf.co.za" },
    update: {},
    create: {
      email: "admin@nusaf.co.za",
      name: "Admin User",
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });
  console.log("Created admin user:", admin.email);

  // Create sales user
  const salesPassword = await hash("sales123", 12);
  const sales = await prisma.user.upsert({
    where: { email: "sales@nusaf.co.za" },
    update: {},
    create: {
      email: "sales@nusaf.co.za",
      name: "Sales User",
      passwordHash: salesPassword,
      role: UserRole.SALES,
      isActive: true,
    },
  });
  console.log("Created sales user:", sales.email);

  // Create suppliers
  const tecom = await prisma.supplier.upsert({
    where: { code: "TECOM" },
    update: {},
    create: {
      name: "Tecom Srl",
      code: "TECOM",
      currency: "EUR",
      defaultFreightType: FreightType.AIR,
      isActive: true,
    },
  });

  const regina = await prisma.supplier.upsert({
    where: { code: "REGINA" },
    update: {},
    create: {
      name: "Regina Catene Calibrate",
      code: "REGINA",
      currency: "EUR",
      defaultFreightType: FreightType.SEA,
      isActive: true,
    },
  });

  const chiaravalli = await prisma.supplier.upsert({
    where: { code: "CHIARA" },
    update: {},
    create: {
      name: "Chiaravalli Group",
      code: "CHIARA",
      currency: "EUR",
      defaultFreightType: FreightType.SEA,
      isActive: true,
    },
  });
  console.log("Created suppliers");

  // Create categories
  const categories = [
    { name: "Conveyor Components", slug: "conveyor-components", brands: ["Nusaf", "Tecom"] },
    { name: "Plastic Table Top Chain", slug: "plastic-table-top-chain", brands: ["Nusaf", "Regina", "Tecom"] },
    { name: "Modular Chain", slug: "modular-chain", brands: ["Nusaf", "Regina"] },
    { name: "SS Table Top Chain", slug: "ss-table-top-chain", brands: ["Regina"] },
    { name: "Gearboxes & Motors", slug: "gearboxes-motors", brands: ["Chiaravalli"] },
    { name: "Power Transmission", slug: "power-transmission", brands: ["Chiaravalli"] },
    { name: "Linear Bearings", slug: "linear-bearings", brands: ["Chiaravalli"] },
    { name: "Thermoplastic Bearings", slug: "thermoplastic-bearings", brands: ["Tecom"] },
    { name: "Bends", slug: "bends", brands: ["Nusaf"] },
    { name: "Wear Strips", slug: "wear-strips", brands: ["Nusaf", "Tecom"] },
    { name: "Moulded Sprockets", slug: "moulded-sprockets", brands: ["Nusaf", "Regina", "Tecom"] },
    { name: "Machined Sprockets", slug: "machined-sprockets", brands: ["Nusaf", "Regina"] },
    { name: "Nusaf Engineering", slug: "nusaf-engineering", brands: ["Nusaf"] },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { brandsAvailable: cat.brands },
      create: {
        name: cat.name,
        slug: cat.slug,
        brandsAvailable: cat.brands,
      },
    });
  }
  console.log("Created categories");

  // Create system config
  await prisma.systemConfig.upsert({
    where: { id: "default-config" },
    update: {},
    create: {
      id: "default-config",
      exchangeRateEurZar: 20.5,
      defaultSeaFreightPercent: 12,
      defaultAirFreightPercent: 30,
      tierDiscountEndUser: 30,
      tierDiscountOem: 40,
      tierDiscountDistributor: 50,
    },
  });
  console.log("Created system config");

  // Create machine rates
  const machineRates = [
    { machineType: "CNC Router", rateType: RateType.HOURLY, rateAmount: 850 },
    { machineType: "Milling Machine", rateType: RateType.HOURLY, rateAmount: 650 },
    { machineType: "Lathe", rateType: RateType.HOURLY, rateAmount: 550 },
    { machineType: "Modular Chain Assembly", rateType: RateType.PER_METER, rateAmount: 45 },
    { machineType: "Table Top Assembly", rateType: RateType.PER_METER, rateAmount: 38 },
    { machineType: "General Assembly", rateType: RateType.PER_EACH, rateAmount: 25 },
  ];

  for (const rate of machineRates) {
    await prisma.machineRate.upsert({
      where: { machineType: rate.machineType },
      update: { rateAmount: rate.rateAmount },
      create: rate,
    });
  }
  console.log("Created machine rates");

  // Create pricing rules
  const conveyorCat = await prisma.category.findUnique({ where: { slug: "conveyor-components" } });
  const pttCat = await prisma.category.findUnique({ where: { slug: "power-transmission" } });
  const chainCat = await prisma.category.findUnique({ where: { slug: "plastic-table-top-chain" } });

  if (conveyorCat) {
    await prisma.pricingRule.create({
      data: {
        categoryId: conveyorCat.id,
        brand: "Nusaf",
        freightType: FreightType.SEA,
        marginFactor: 0.5,
        priority: 10,
        isActive: true,
      },
    });

    await prisma.pricingRule.create({
      data: {
        categoryId: conveyorCat.id,
        brand: "Tecom",
        freightType: FreightType.AIR,
        marginFactor: 0.5,
        priority: 10,
        isActive: true,
      },
    });
  }

  if (chainCat) {
    await prisma.pricingRule.create({
      data: {
        categoryId: chainCat.id,
        brand: "Regina",
        freightType: FreightType.SEA,
        marginFactor: 0.45,
        priority: 10,
        isActive: true,
      },
    });
  }

  if (pttCat) {
    await prisma.pricingRule.create({
      data: {
        categoryId: pttCat.id,
        brand: "Chiaravalli",
        freightType: FreightType.SEA,
        marginFactor: 0.55,
        priority: 10,
        isActive: true,
      },
    });
  }
  console.log("Created pricing rules");

  // Create sample products
  if (conveyorCat) {
    await prisma.product.upsert({
      where: { nusafSku: "1200-80271" },
      update: {},
      create: {
        nusafSku: "1200-80271",
        supplierSku: "C020080271",
        name: "Connection joint for round tubes",
        description: "Zinc plated connection joint for 60.3mm round tubes",
        categoryId: conveyorCat.id,
        supplierId: tecom.id,
        brand: "Nusaf",
        productType: ProductType.IMPORTED,
        lastCostEur: 15.5,
        lastCostZar: 317.75,
        isActive: true,
      },
    });
  }

  if (chainCat) {
    await prisma.product.upsert({
      where: { nusafSku: "UP880MRGKD/000" },
      update: {},
      create: {
        nusafSku: "UP880MRGKD/000",
        supplierSku: "UP880MRGKD/000",
        name: "Plastic Table Top Chain 880M Series",
        description: "UP material, 82.6mm width, 4.0mm thickness",
        categoryId: chainCat.id,
        supplierId: regina.id,
        brand: "Regina",
        productType: ProductType.IMPORTED,
        lastCostEur: 45.0,
        lastCostZar: 922.5,
        isActive: true,
      },
    });
  }

  const engineeringCat = await prisma.category.findUnique({ where: { slug: "nusaf-engineering" } });
  if (engineeringCat) {
    await prisma.product.upsert({
      where: { nusafSku: "NC-2024-001" },
      update: {},
      create: {
        nusafSku: "NC-2024-001",
        name: "Custom Machined Bracket",
        description: "Custom machined aluminum bracket",
        categoryId: engineeringCat.id,
        brand: "Nusaf",
        productType: ProductType.MANUFACTURED,
        lastCostZar: 350.0,
        isActive: true,
      },
    });
  }
  console.log("Created sample products");

  // Create sample customer
  await prisma.customer.upsert({
    where: { email: "john@abcmfg.co.za" },
    update: {},
    create: {
      companyName: "ABC Manufacturing",
      contactName: "John Smith",
      email: "john@abcmfg.co.za",
      phone: "+27 11 123 4567",
      tier: CustomerTier.OEM_RESELLER,
      vatNumber: "4123456789",
      isApproved: true,
      approvedAt: new Date(),
    },
  });
  console.log("Created sample customer");

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
