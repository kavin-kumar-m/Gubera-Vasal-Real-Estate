import { getSql } from '../api/_db.js';
import { defaultProperties } from '../src/data/properties.js';

async function seed() {
  const sql = getSql();
  console.log('Ensuring projects table exists in Neon...');
  await sql`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      sub_location TEXT,
      property_type TEXT DEFAULT 'Gated Community Plots' NOT NULL,
      description TEXT,
      starting_price TEXT NOT NULL,
      price_per_cent TEXT,
      plot_sizes TEXT DEFAULT '1.75 to 8.0 Cents' NOT NULL,
      sqft_range TEXT DEFAULT '762 – 3,485 Sq.Ft',
      loan_eligibility TEXT DEFAULT '80% to 90% Bank Loan Approved by All Major Banks' NOT NULL,
      image_url TEXT NOT NULL,
      gallery JSONB DEFAULT '[]'::jsonb,
      highlights JSONB DEFAULT '[]'::jsonb,
      status TEXT DEFAULT 'Available',
      is_featured BOOLEAN DEFAULT true,
      has_video_tour BOOLEAN DEFAULT true,
      video_url TEXT,
      video_title TEXT,
      display_order INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_projects_order ON projects (display_order ASC, created_at DESC);`;

  const countRes = await sql`SELECT count(*)::int as count FROM projects;`;
  if (countRes[0]?.count === 0) {
    console.log(`Seeding ${defaultProperties.length} layouts into projects table...`);
    for (let i = 0; i < defaultProperties.length; i++) {
      const p = defaultProperties[i];
      await sql`
        INSERT INTO projects (
          id, name, location, sub_location, property_type, description,
          starting_price, price_per_cent, plot_sizes, sqft_range,
          loan_eligibility, image_url, gallery, highlights, status,
          is_featured, has_video_tour, video_url, video_title, display_order
        ) VALUES (
          ${p.id || `prop-${i + 1}`}, ${p.name}, ${p.location}, ${p.subLocation || null},
          ${p.propertyType || 'Gated Community Plots'}, ${p.description || null},
          ${p.startingPrice}, ${p.pricePerCent || null}, ${p.plotSizes || p.plotSizeCents || '1.75 to 8.0 Cents'},
          ${p.sqftRange || p.area || '762 – 3,485 Sq.Ft'}, ${p.loanEligibility || '80% to 90% Bank Loan Approved by All Major Banks'},
          ${p.imageUrl}, ${JSON.stringify(p.gallery || [])}::jsonb, ${JSON.stringify(p.highlights || p.features || [])}::jsonb,
          ${p.status || 'Available'}, ${p.isFeatured ?? p.featured ?? true}, ${p.hasVideoTour ?? true},
          ${p.videoUrl || null}, ${p.videoTitle || null}, ${i}
        )
        ON CONFLICT (id) DO NOTHING;
      `;
    }
    console.log('✅ Layouts seeded successfully!');
  } else {
    console.log(`Projects table already contains ${countRes[0].count} records.`);
  }

  const list = await sql`SELECT id, name, location, starting_price FROM projects ORDER BY display_order ASC;`;
  console.log('--- Current Projects in Neon ---');
  list.forEach(item => {
    console.log(`- [${item.id}] ${item.name} (${item.location}) - Starting at ${item.starting_price}`);
  });
  console.log(`\n🎉 Total projects ready in database: ${list.length}`);
}

seed().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
