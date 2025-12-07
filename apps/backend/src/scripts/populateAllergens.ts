import prisma from '../config/prisma';

// Common allergens by food type
const allergenData: Record<string, string[]> = {
  // Chicken items
  'Orange Chicken': ['Soy', 'Wheat', 'Sesame'],
  'Kung Pao Chicken': ['Peanuts', 'Soy', 'Wheat'],
  'Beijing Beef': ['Soy', 'Wheat', 'Sesame'],
  'Broccoli Beef': ['Soy', 'Wheat'],
  'Mushroom Chicken': ['Soy', 'Wheat'],
  'String Bean Chicken Breast': ['Soy', 'Wheat'],
  'SweetFire Chicken Breast': ['Soy', 'Wheat'],
  'Black Pepper Sirloin Steak': ['Soy', 'Wheat'],
  'Grilled Teriyaki Chicken': ['Soy', 'Wheat', 'Sesame'],
  'Black Pepper Chicken': ['Soy', 'Wheat'],
  
  // Seafood items
  'Honey Walnut Shrimp': ['Shellfish', 'Tree Nuts', 'Eggs', 'Wheat'],
  'Honey Sesame Chicken Breast': ['Soy', 'Wheat', 'Sesame'],
  
  // Sides
  'Chow Mein': ['Wheat', 'Soy', 'Eggs'],
  'Fried Rice': ['Soy', 'Eggs'],
  'White Steamed Rice': [],
  'Super Greens': ['Soy'],
  
  // Appetizers
  'Chicken Egg Roll': ['Wheat', 'Eggs', 'Soy'],
  'Veggie Spring Roll': ['Wheat', 'Soy'],
  'Cream Cheese Rangoon': ['Dairy', 'Wheat', 'Eggs'],
  'Apple Pie Roll': ['Wheat', 'Dairy', 'Eggs'],
};

async function populateAllergens() {
  try {
    console.log('Starting allergen data population...');

    const menuItems = await prisma.menu_items.findMany({
      where: {
        name: {
          not: null,
        },
      },
    });

    let updatedCount = 0;

    for (const item of menuItems) {
      if (!item.name) continue;

      // Check if allergen data exists for this item
      const allergens = allergenData[item.name] || [];
      
      if (allergens.length > 0 || allergenData.hasOwnProperty(item.name)) {
        await prisma.menu_items.update({
          where: { menu_item_id: item.menu_item_id },
          data: {
            allergens: JSON.stringify(allergens),
            allergen_info: allergens.length > 0 
              ? `Contains: ${allergens.join(', ')}` 
              : 'No major allergens',
          },
        });
        updatedCount++;
        console.log(`✓ Updated ${item.name}: ${allergens.length} allergens`);
      }
    }

    console.log(`\n✅ Successfully updated ${updatedCount} menu items with allergen information`);
    console.log('📝 Note: Items without allergen data were not modified');
  } catch (error) {
    console.error('❌ Error populating allergen data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
populateAllergens();



