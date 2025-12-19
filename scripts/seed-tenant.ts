import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding default tenant...');

  const existing = await prisma.tenant.findUnique({
    where: { slug: 'default' },
  });

  if (!existing) {
    const tenant = await prisma.tenant.create({
      data: {
        slug: 'default',
        name: 'Settler Default',
        isActive: true,
        metadata: {
            description: 'Default system tenant',
        },
        branding: {
            create: {
                primaryColor: '#2563eb',
                secondaryColor: '#7c3aed',
            }
        },
        navigation: {
            create: {
                navItems: [],
                footerItems: []
            }
        }
      },
    });
    console.log('Created default tenant:', tenant.id);
  } else {
    console.log('Default tenant already exists:', existing.id);
  }

  // Also seed a default page
  const defaultTenant = await prisma.tenant.findUnique({ where: { slug: 'default' } });
  if (defaultTenant) {
      const homePage = await prisma.tenantPage.findUnique({
          where: {
              tenantId_slug: {
                  tenantId: defaultTenant.id,
                  slug: 'home-v1' // avoiding empty slug conflict if any
              }
          }
      });

      if (!homePage) {
          await prisma.tenantPage.create({
              data: {
                  tenantId: defaultTenant.id,
                  slug: 'home-v1',
                  pageType: 'marketing',
                  isDraft: false,
                  blocks: [
                      {
                        id: 'hero-1',
                        type: 'hero',
                        visible: true,
                        title: 'Welcome to Settler',
                        subtitle: 'Financial Infrastructure for Developers',
                        alignment: 'center'
                      }
                  ]
              }
          });
          console.log('Created default home page');
      }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
