import Category, { MAIN_CATEGORIES } from "../models/Category.js";

// ─── Helper ───────────────────────────────────────────────────────────────────
const toSlug = (str) =>
  str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

// ─── Root-level CRUD ──────────────────────────────────────────────────────────

// GET all categories  (optionally filter by ?mainCategory=artisanat)
const getCategories = async (req, res) => {
  try {
    const filter = {};
    if (req.query.mainCategory) filter.mainCategory = req.query.mainCategory;
    const categories = await Category.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET single category
const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ success: false, message: "Catégorie introuvable" });
    res.status(200).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET categories grouped by mainCategory
const getCategoriesGrouped = async (_req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    const grouped = MAIN_CATEGORIES.reduce((acc, key) => {
      acc[key] = categories.filter((c) => c.mainCategory === key);
      return acc;
    }, {});
    res.status(200).json({ success: true, data: grouped });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST create category
const createCategory = async (req, res) => {
  try {
    const { name, description, subcategories, image, mainCategory } = req.body;

    const existing = await Category.findOne({ name });
    if (existing)
      return res.status(400).json({ success: false, message: "Cette catégorie existe déjà" });

    const category = new Category({
      name,
      mainCategory,
      image: image || "",
      description,
      subcategories: subcategories || [],
    });
    await category.save();

    res.status(201).json({ success: true, data: category, message: "Catégorie créée avec succès" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT update category
const updateCategory = async (req, res) => {
  try {
    const { name, description, subcategories, isActive, image, mainCategory } = req.body;

    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ success: false, message: "Catégorie introuvable" });

    if (name)                        category.name          = name;
    if (image !== undefined)         category.image         = image;
    if (description !== undefined)   category.description   = description;
    if (subcategories !== undefined) category.subcategories = subcategories;
    if (isActive !== undefined)      category.isActive      = isActive;
    if (mainCategory)                category.mainCategory  = mainCategory;

    await category.save();
    res.status(200).json({ success: true, data: category, message: "Catégorie mise à jour" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE category
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category)
      return res.status(404).json({ success: false, message: "Catégorie introuvable" });
    res.status(200).json({ success: true, message: "Catégorie supprimée avec succès" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Level-2  (POST/DELETE /categories/:id/subcategories[/:subId]) ────────────

const addSubcategory = async (req, res) => {
  try {
    const { name, image } = req.body;
    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ success: false, message: "Catégorie introuvable" });

    category.subcategories.push({ name, slug: toSlug(name), image: image || "", subcategories: [] });
    await category.save();
    res.status(200).json({ success: true, data: category, message: "Sous-catégorie ajoutée" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteSubcategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ success: false, message: "Catégorie introuvable" });

    category.subcategories = category.subcategories.filter(
      (sub) => sub._id.toString() !== req.params.subId
    );
    await category.save();
    res.status(200).json({ success: true, data: category, message: "Sous-catégorie supprimée" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Level-3  (POST/DELETE …/:subId/subcategories[/:subSubId]) ───────────────

const addSubSubcategory = async (req, res) => {
  try {
    const { name, image } = req.body;
    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ success: false, message: "Catégorie introuvable" });

    const l2 = category.subcategories.id(req.params.subId);
    if (!l2)
      return res.status(404).json({ success: false, message: "Sous-catégorie introuvable" });

    l2.subcategories.push({ name, slug: toSlug(name), image: image || "", subcategories: [] });
    await category.save();
    res.status(200).json({ success: true, data: category, message: "Niveau 3 ajouté" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteSubSubcategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ success: false, message: "Catégorie introuvable" });

    const l2 = category.subcategories.id(req.params.subId);
    if (!l2)
      return res.status(404).json({ success: false, message: "Sous-catégorie introuvable" });

    l2.subcategories = l2.subcategories.filter(
      (s) => s._id.toString() !== req.params.subSubId
    );
    await category.save();
    res.status(200).json({ success: true, data: category, message: "Niveau 3 supprimé" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Level-4  (POST/DELETE …/:subSubId/subcategories[/:itemId]) ──────────────

// POST /categories/:id/subcategories/:subId/subcategories/:subSubId/subcategories
const addLevel4 = async (req, res) => {
  try {
    const { name, image } = req.body;
    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ success: false, message: "Catégorie introuvable" });

    const l2 = category.subcategories.id(req.params.subId);
    if (!l2)
      return res.status(404).json({ success: false, message: "Sous-catégorie (L2) introuvable" });

    const l3 = l2.subcategories.id(req.params.subSubId);
    if (!l3)
      return res.status(404).json({ success: false, message: "Sous-catégorie (L3) introuvable" });

    l3.subcategories.push({ name, slug: toSlug(name), image: image || "" });
    await category.save();
    res.status(200).json({ success: true, data: category, message: "Niveau 4 ajouté" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /categories/:id/subcategories/:subId/subcategories/:subSubId/subcategories/:itemId
const deleteLevel4 = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ success: false, message: "Catégorie introuvable" });

    const l2 = category.subcategories.id(req.params.subId);
    if (!l2)
      return res.status(404).json({ success: false, message: "Sous-catégorie (L2) introuvable" });

    const l3 = l2.subcategories.id(req.params.subSubId);
    if (!l3)
      return res.status(404).json({ success: false, message: "Sous-catégorie (L3) introuvable" });

    l3.subcategories = l3.subcategories.filter(
      (item) => item._id.toString() !== req.params.itemId
    );
    await category.save();
    res.status(200).json({ success: true, data: category, message: "Niveau 4 supprimé" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Seed ─────────────────────────────────────────────────────────────────────
const seedCategories = async (req, res) => {
  try {
    const defaultCategories = [

      // ══════════════════════════════════════════════════════════════════════
      // mainCategory: "artisanat"
      // ══════════════════════════════════════════════════════════════════════

      // ── 1. Bijoux et accessoires ──────────────────────────────────────────
      {
        name:         "Bijoux et accessoires",
        slug:         "bijoux-et-accessoires",
        mainCategory: "artisanat",
        image:        "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=85",
        description:  "Bijoux traditionnels et accessoires",
        subcategories: [
          {
            name: "Bijoux", slug: "bijoux",
            subcategories: [
              {
                name: "Bijoux modernes", slug: "bijoux-modernes",
                subcategories: [
                  { name: "Colliers et pendentifs", slug: "colliers-et-pendentifs" },
                  { name: "Bracelets",              slug: "bracelets" },
                  { name: "Bagues",                 slug: "bagues" },
                  { name: "Boucles d'oreilles",     slug: "boucles-doreilles" },
                  { name: "Parures",                slug: "parures" },
                ],
              },
              {
                name: "Bijoux traditionnels", slug: "bijoux-traditionnels",
                subcategories: [
                  { name: "Fibules (tizerzai)",                slug: "fibules-tizerzai" },
                  { name: "Bracelets amazigh (Megyess)",        slug: "bracelets-amazigh-megyess" },
                  { name: "Colliers (Tilila / Chaaria)",        slug: "colliers-tilila-chaaria" },
                  { name: "Lakkata",                            slug: "lakkata" },
                  { name: "Ebrid nesslesel",                    slug: "ebrid-nesslesel" },
                  { name: "Fibules jaune",                      slug: "fibules-jaune" },
                  { name: "Fibules lune",                       slug: "fibules-lune" },
                  { name: "Fibules câblé",                      slug: "fibules-cable" },
                  { name: "Boucles d'oreilles traditionnelles", slug: "boucles-doreilles-trad" },
                  { name: "Bijoux de tête",                     slug: "bijoux-de-tete" },
                  { name: "Noichen",                            slug: "noichen" },
                  { name: "Tigar",                              slug: "tigar" },
                  { name: "Chekheb",                            slug: "chekheb" },
                ],
              },
            ],
          },
          {
            name: "Sacs", slug: "sacs",
            subcategories: [
              {
                name: "Types de sacs", slug: "types-de-sacs",
                subcategories: [
                  { name: "Sac en cuir",          slug: "sac-en-cuir" },
                  { name: "Portefeuilles",         slug: "portefeuilles" },
                  { name: "Portefeuilles margoum", slug: "portefeuilles-margoum" },
                  { name: "Tote bags",             slug: "tote-bags" },
                  { name: "Pochettes",             slug: "pochettes" },
                  { name: "Couffin",               slug: "couffin" },
                ],
              },
            ],
          },
          {
            name: "Chapeaux", slug: "chapeaux",
            subcategories: [
              {
                name: "Types de chapeaux", slug: "types-de-chapeaux",
                subcategories: [
                  { name: "Mdhall",     slug: "mdhall" },
                  { name: "Chechia",    slug: "chechia" },
                  { name: "Casquettes", slug: "casquettes" },
                ],
              },
            ],
          },
          {
            name: "Autres accessoires", slug: "autres-accessoires",
            subcategories: [
              {
                name: "Divers", slug: "divers-accessoires",
                subcategories: [
                  { name: "Porte-clés",                slug: "porte-cles" },
                  { name: "Éventail",                  slug: "eventail" },
                  { name: "Accessoires de téléphones", slug: "accessoires-telephones" },
                  { name: "Sacs artisanaux",           slug: "sacs-artisanaux" },
                  { name: "Ceintures traditionnelles", slug: "ceintures-traditionnelles" },
                ],
              },
            ],
          },
        ],
      },

      // ── 2. Trésors de la gastronomie ──────────────────────────────────────
      {
        name:         "Trésors de la gastronomie",
        slug:         "tresors-de-la-gastronomie",
        mainCategory: "artisanat",
        image:        "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=800&q=85",
        description:  "Produits alimentaires artisanaux",
        subcategories: [
          {
            name: "Bsissa", slug: "bsissa",
            subcategories: [
              {
                name: "Types de bsissa", slug: "types-de-bsissa",
                subcategories: [
                  { name: "Blé",           slug: "bsissa-ble" },
                  { name: "Pois chiches",  slug: "bsissa-pois-chiches" },
                  { name: "Lentille",      slug: "bsissa-lentille" },
                  { name: "Sorgho",        slug: "bsissa-sorgho" },
                  { name: "Fruits secs",   slug: "bsissa-fruits-secs" },
                  { name: "Orge",          slug: "bsissa-orge" },
                  { name: "Sans gluten",   slug: "bsissa-sans-gluten" },
                  { name: "En poudre",     slug: "bsissa-en-poudre" },
                  { name: "Mélangée",      slug: "bsissa-melangee" },
                  { name: "Autres bsissa", slug: "bsissa-autres" },
                ],
              },
            ],
          },
          {
            name: "Confitures", slug: "confitures",
            subcategories: [
              {
                name: "Types de confitures", slug: "types-de-confitures",
                subcategories: [
                  { name: "Confiture de dattes",  slug: "confiture-dattes" },
                  { name: "Confiture de grenade", slug: "confiture-grenade" },
                  { name: "Confiture de pomme",   slug: "confiture-pomme" },
                  { name: "Confiture d'orange",   slug: "confiture-orange" },
                  { name: "Autres confitures",    slug: "confitures-autres" },
                  { name: "Sirop de dattes",      slug: "sirop-dattes" },
                ],
              },
            ],
          },
          {
            name: "Graines et céréales", slug: "graines-et-cereales",
            subcategories: [
              {
                name: "Types de céréales", slug: "types-de-cereales",
                subcategories: [
                  { name: "Couscous blé",        slug: "couscous-ble" },
                  { name: "Couscous melthout",   slug: "couscous-melthout" },
                  { name: "Couscous",            slug: "couscous" },
                  { name: "Produit sans gluten", slug: "produit-sans-gluten" },
                  { name: "Borghol",             slug: "borghol" },
                  { name: "Granola",             slug: "granola" },
                  { name: "Dechicha",            slug: "dechicha" },
                  { name: "Rechta Eskef",        slug: "rechta-eskef" },
                  { name: "Chroba",              slug: "chroba" },
                  { name: "Mhames",              slug: "mhames" },
                  { name: "Sorgho",              slug: "sorgho" },
                ],
              },
            ],
          },
          {
            name: "Farines", slug: "farines",
            subcategories: [
              {
                name: "Types de farines", slug: "types-de-farines",
                subcategories: [
                  { name: "Farine de blé",              slug: "farine-ble" },
                  { name: "Farine d'orge",              slug: "farine-orge" },
                  { name: "Farine de maïs",             slug: "farine-mais" },
                  { name: "Farine de flocons d'avoine", slug: "farine-avoine" },
                ],
              },
            ],
          },
          {
            name: "Miels", slug: "miels",
            subcategories: [
              {
                name: "Types de miels", slug: "types-de-miels",
                subcategories: [
                  { name: "Miel de cèdre",    slug: "miel-cedre" },
                  { name: "Miel de montagne", slug: "miel-montagne" },
                  { name: "Miel de thym",     slug: "miel-thym" },
                  { name: "Miel de romarin",  slug: "miel-romarin" },
                  { name: "Miel multiflore",  slug: "miel-multiflore" },
                  { name: "Autres miels",     slug: "miels-autres" },
                ],
              },
            ],
          },
          {
            name: "Huile d'olive", slug: "huile-dolive",
            subcategories: [
              {
                name: "Par région", slug: "huile-par-region",
                subcategories: [
                  { name: "Huile de Gafsa",   slug: "huile-gafsa" },
                  { name: "Huile de Douiret", slug: "huile-douiret" },
                  { name: "Huile de Djerba",  slug: "huile-djerba" },
                  { name: "Huile de Matmata", slug: "huile-matmata" },
                  { name: "Huile de Sahel",   slug: "huile-sahel" },
                  { name: "Huile de Sfax",    slug: "huile-sfax" },
                  { name: "Huile du nord",    slug: "huile-nord" },
                ],
              },
              {
                name: "Olives", slug: "olives",
                subcategories: [
                  { name: "Olives noires",          slug: "olives-noires" },
                  { name: "Olives vertes de table", slug: "olives-vertes-table" },
                  { name: "Olives vertes fokhar",   slug: "olives-vertes-fokhar" },
                ],
              },
            ],
          },
          {
            name: "Figues", slug: "figues",
            subcategories: [
              {
                name: "Types de figues", slug: "types-de-figues",
                subcategories: [
                  { name: "Figues fraîches vertes",      slug: "figues-fraiches-vertes" },
                  { name: "Figues fraîches noires Zidi", slug: "figues-fraiches-noires-zidi" },
                  { name: "Figues séchées",              slug: "figues-sechees" },
                  { name: "Chriha",                      slug: "chriha" },
                  { name: "Gherbouz",                    slug: "gherbouz" },
                ],
              },
            ],
          },
          {
            name: "Viandes artisanales", slug: "viandes-artisanales",
            subcategories: [
              {
                name: "Types de viandes", slug: "types-de-viandes",
                subcategories: [
                  { name: "Kaddid",          slug: "kaddid" },
                  { name: "Ousben kerkouch", slug: "ousben-kerkouch" },
                  { name: "Merguez",         slug: "merguez" },
                ],
              },
            ],
          },
          {
            name: "Dattes", slug: "dattes",
            subcategories: [],
          },
          {
            name: "Épices et mélanges traditionnels", slug: "epices-melanges-traditionnels",
            subcategories: [
              {
                name: "Types d'épices", slug: "types-depices",
                subcategories: [
                  { name: "Ail",           slug: "ail" },
                  { name: "Yazoul",        slug: "yazoul" },
                  { name: "Harissa",       slug: "harissa" },
                  { name: "Tomate séchée", slug: "tomate-sechee" },
                ],
              },
            ],
          },
          {
            name: "Fromages", slug: "fromages",
            subcategories: [],
          },
          {
            name: "Pâtisseries", slug: "patisseries",
            subcategories: [
              {
                name: "Types de pâtisseries", slug: "types-de-patisseries",
                subcategories: [
                  { name: "Biscuits healthy",         slug: "biscuits-healthy" },
                  { name: "Makroudh",                 slug: "makroudh" },
                  { name: "Sablé au sirop de dattes", slug: "sable-sirop-dattes" },
                ],
              },
            ],
          },
          {
            name: "Herbes médicinales", slug: "herbes-medicinales",
            subcategories: [
              {
                name: "Types d'herbes", slug: "types-dherbes",
                subcategories: [
                  { name: "Romarin", slug: "romarin" },
                  { name: "Armoise", slug: "armoise" },
                ],
              },
            ],
          },
        ],
      },

      // ── 3. Produits du terroir ─────────────────────────────────────────────
      {
        name:         "Produits du terroir",
        slug:         "produits-du-terroir",
        mainCategory: "artisanat",
        image:        "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&q=85",
        description:  "Produits locaux authentiques",
        subcategories: [
          {
            name: "Produits laitiers", slug: "produits-laitiers",
            subcategories: [
              {
                name: "Types de produits laitiers", slug: "types-produits-laitiers",
                subcategories: [
                  { name: "Fromages artisanaux chèvre",      slug: "fromages-chevre" },
                  { name: "Lait de chèvre",                  slug: "lait-chevre" },
                  { name: "Lait de chameau",                 slug: "lait-chameau" },
                  { name: "Produits laitiers traditionnels", slug: "produits-laitiers-traditionnels" },
                ],
              },
            ],
          },
          {
            name: "Produits régionaux", slug: "produits-regionaux",
            subcategories: [
              {
                name: "Types de produits régionaux", slug: "types-produits-regionaux",
                subcategories: [
                  { name: "Produits de montagne", slug: "produits-montagne" },
                  { name: "Olives terroir",       slug: "olives-terroir" },
                  { name: "Harissa",              slug: "terroir-harissa" },
                  { name: "Yazoul",               slug: "terroir-yazoul" },
                  { name: "Confiture de dattes",  slug: "terroir-confiture-dattes" },
                  { name: "Figues",               slug: "terroir-figues" },
                  { name: "Figues séchées",       slug: "terroir-figues-sechees" },
                ],
              },
            ],
          },
        ],
      },

      // ── 4. Coffrets cadeaux ────────────────────────────────────────────────
      {
        name:         "Coffrets cadeaux",
        slug:         "coffrets-cadeaux",
        mainCategory: "artisanat",
        image:        "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&q=85",
        description:  "Coffrets artisanaux et personnalisés",
        subcategories: [
          {
            name: "Types de coffrets", slug: "types-de-coffrets",
            subcategories: [
              {
                name: "Coffrets thématiques", slug: "coffrets-thematiques",
                subcategories: [
                  { name: "Coffrets traditionnels amazighs", slug: "coffrets-traditionnels-amazighs" },
                  { name: "Coffrets mariage / henné",        slug: "coffrets-mariage-henne" },
                  { name: "Coffrets bien-être",              slug: "coffrets-bien-etre" },
                  { name: "Coffrets gourmands",              slug: "coffrets-gourmands" },
                  { name: "Coffrets personnalisés",          slug: "coffrets-personnalises" },
                ],
              },
            ],
          },
        ],
      },

      // ── 5. Vêtements et chaussures ─────────────────────────────────────────
      {
        name:         "Vêtements et chaussures",
        slug:         "vetements-et-chaussures",
        mainCategory: "artisanat",
        image:        "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=85",
        description:  "Vêtements et chaussures traditionnels",
        subcategories: [
          {
            name: "Vêtements", slug: "vetements",
            subcategories: [
              {
                name: "Vêtements traditionnels", slug: "vetements-traditionnels",
                subcategories: [
                  { name: "Robes amazighes traditionnelles", slug: "robes-amazighes-traditionnelles" },
                  { name: "Burnous et vêtements en laine",  slug: "burnous-vetements-laine" },
                  { name: "Écharpe",                        slug: "echarpe" },
                  { name: "Bekhnoug",                       slug: "bekhnoug" },
                  { name: "Kachabia",                       slug: "kachabia" },
                  { name: "Wezra",                          slug: "wezra" },
                  { name: "Houli",                          slug: "houli" },
                  { name: "Jebba khemri",                   slug: "jebba-khemri" },
                  { name: "Jebba sekrouda",                 slug: "jebba-sekrouda" },
                  { name: "Jebba homme",                    slug: "jebba-homme" },
                  { name: "Jebba femme",                    slug: "jebba-femme" },
                  { name: "Koftane",                        slug: "koftane" },
                  { name: "Taajira",                        slug: "taajira" },
                  { name: "Fouta et blouza",                slug: "fouta-blouza" },
                  { name: "Chemise chebka",                 slug: "chemise-chebka" },
                  { name: "Chemise adass et kontil",        slug: "chemise-adass-kontil" },
                  { name: "Pul fadhila",                    slug: "pul-fadhila" },
                  { name: "Pul rouhia",                     slug: "pul-rouhia" },
                ],
              },
              {
                name: "Vêtements modernes inspirés amazigh", slug: "vetements-modernes-inspires-amazigh",
                subcategories: [
                  { name: "Aassab traditionnel", slug: "aassab-traditionnel" },
                  { name: "Aassab moderne",      slug: "aassab-moderne" },
                ],
              },
            ],
          },
          {
            name: "Chaussures", slug: "chaussures",
            subcategories: [
              {
                name: "Types de chaussures", slug: "types-de-chaussures",
                subcategories: [
                  { name: "Balgha",                                      slug: "balgha" },
                  { name: "Sandales en cuir",                            slug: "sandales-cuir" },
                  { name: "Erkessen",                                    slug: "erkessen" },
                  { name: "Chaussures modernes inspirées traditionnels", slug: "chaussures-modernes-inspires" },
                ],
              },
            ],
          },
        ],
      },

      // ── 6. Maison et décoration ────────────────────────────────────────────
      {
        name:         "Maison et décoration",
        slug:         "maison-et-decoration",
        mainCategory: "artisanat",
        image:        "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&q=85",
        description:  "Décoration artisanale et objets de maison",
        subcategories: [
          {
            name: "Tissages amazigh", slug: "tissages-amazigh",
            subcategories: [
              {
                name: "Klim et margoum", slug: "klim-et-margoum",
                subcategories: [
                  { name: "Klim margoum Douiret",       slug: "klim-margoum-douiret" },
                  { name: "Klim margoum Ouedhref",      slug: "klim-margoum-ouedhref" },
                  { name: "Klim margoum Gafsa Sined",   slug: "klim-margoum-gafsa-sined" },
                  { name: "Klim simple multi couleurs", slug: "klim-simple-multi-couleurs" },
                  { name: "Klim chwalek balloum",       slug: "klim-chwalek-balloum" },
                ],
              },
              {
                name: "Coussins et couvertures", slug: "coussins-et-couvertures",
                subcategories: [
                  { name: "Coussin margoum",           slug: "coussin-margoum" },
                  { name: "Couverture margoum",        slug: "couverture-margoum" },
                  { name: "Couverture en laine gafsi", slug: "couverture-laine-gafsi" },
                  { name: "Jetés de canapé et plaids", slug: "jetes-canape-plaids" },
                  { name: "Coussins et housses",       slug: "coussins-housses" },
                ],
              },
            ],
          },
          {
            name: "Broderie amazighe", slug: "broderie-amazighe",
            subcategories: [
              {
                name: "Types de broderie", slug: "types-de-broderie",
                subcategories: [
                  { name: "Broderie à la main",    slug: "broderie-main" },
                  { name: "Parure point de croix", slug: "parure-point-de-croix" },
                  { name: "Parure de lit",         slug: "parure-de-lit" },
                  { name: "Parure",                slug: "parure" },
                  { name: "Draps",                 slug: "draps" },
                ],
              },
            ],
          },
          {
            name: "Poterie et bois", slug: "poterie-et-bois",
            subcategories: [
              { name: "Poterie amazighe",     slug: "poterie-amazighe",     subcategories: [] },
              { name: "Objets en bois sculpté", slug: "objets-bois-sculpte", subcategories: [] },
            ],
          },
          {
            name: "Tapis", slug: "tapis",
            subcategories: [
              {
                name: "Types de tapis", slug: "types-de-tapis",
                subcategories: [
                  { name: "Tapis de haute laine", slug: "tapis-haute-laine" },
                ],
              },
            ],
          },
          {
            name: "Décoration murale", slug: "decoration-murale",
            subcategories: [
              {
                name: "Éléments décoratifs", slug: "elements-decoratifs",
                subcategories: [
                  { name: "Articles en base de palmier", slug: "articles-palmier" },
                  { name: "Miroir",                      slug: "miroir" },
                  { name: "Vases",                       slug: "vases" },
                  { name: "Rideaux",                     slug: "rideaux" },
                  { name: "Pot de plante",               slug: "pot-de-plante" },
                ],
              },
            ],
          },
          {
            name: "Luminaires et bougies", slug: "luminaires-et-bougies",
            subcategories: [
              {
                name: "Types de luminaires", slug: "types-de-luminaires",
                subcategories: [
                  { name: "Lampes artisanales", slug: "lampes-artisanales" },
                  { name: "Luminaires",         slug: "luminaires" },
                  { name: "Porte-bougie",       slug: "porte-bougie" },
                  { name: "Bougies parfumées",  slug: "bougies-parfumees" },
                  { name: "Paniers",            slug: "paniers" },
                  { name: "Couffin",            slug: "couffin-deco" },
                ],
              },
            ],
          },
          {
            name: "Cuisine et arts de la table", slug: "cuisine-et-arts-de-la-table",
            subcategories: [
              {
                name: "Ustensiles et vaisselle", slug: "ustensiles-et-vaisselle",
                subcategories: [
                  { name: "Ustensiles de cuisine traditionnels", slug: "ustensiles-cuisine-traditionnels" },
                  { name: "Tajines artisanaux",                  slug: "tajines-artisanaux" },
                  { name: "Plateaux et services",                slug: "plateaux-services" },
                  { name: "Objets de cuisine en bois",           slug: "cuisine-bois" },
                  { name: "Assiettes et bols",                   slug: "assiettes-bols" },
                  { name: "Tasses",                              slug: "tasses" },
                  { name: "Sous-plats et sous-tasses",           slug: "sous-plats-sous-tasses" },
                  { name: "Bkhour traditionnel",                 slug: "bkhour-traditionnel" },
                ],
              },
            ],
          },
        ],
      },

      // ── 7. Cosmétiques naturels ────────────────────────────────────────────
      {
        name:         "Cosmétiques naturels",
        slug:         "cosmetiques-naturels",
        mainCategory: "artisanat",
        image:        "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&q=85",
        description:  "Produits de beauté naturels et bio",
        subcategories: [
          {
            name: "Soins du corps", slug: "soins-du-corps",
            subcategories: [
              {
                name: "Types de soins", slug: "types-de-soins",
                subcategories: [
                  { name: "Savon traditionnel",     slug: "savon-traditionnel" },
                  { name: "Produits de hammam",     slug: "produits-hammam" },
                  { name: "Henna",                  slug: "henna" },
                  { name: "Herkous",                slug: "herkous" },
                  { name: "Produits de beauté bio", slug: "produits-beaute-bio" },
                ],
              },
            ],
          },
          {
            name: "Huiles et parfums", slug: "huiles-et-parfums",
            subcategories: [
              {
                name: "Types d'huiles", slug: "types-dhuiles",
                subcategories: [
                  { name: "Huiles naturelles",   slug: "huiles-naturelles" },
                  { name: "Huiles essentielles", slug: "huiles-essentielles" },
                  { name: "Parfums naturels",    slug: "parfums-naturels" },
                ],
              },
            ],
          },
          {
            name: "Soins pour cheveux", slug: "soins-cheveux",
            subcategories: [],
          },
        ],
      },

<<<<<<< HEAD

=======
      // ══════════════════════════════════════════════════════════════════════
      // mainCategory: "art-et-culture"
      // ══════════════════════════════════════════════════════════════════════
      {
        name:         "Art et culture",
        slug:         "art-et-culture",
        mainCategory: "art-et-culture",
        image:        "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=800&q=85",
        description:  "Art, patrimoine et culture amazigh",
        subcategories: [
          {
            name: "Peinture", slug: "peinture",
            subcategories: [
              {
                name: "Styles de peinture", slug: "styles-de-peinture",
                subcategories: [
                  { name: "Tableaux amazighs",          slug: "tableaux-amazighs" },
                  { name: "Symboles et motifs berbères", slug: "symboles-motifs-berberes" },
                  { name: "Calligraphie tifinagh",       slug: "calligraphie-tifinagh" },
                ],
              },
            ],
          },
          {
            name: "Objets culturels", slug: "objets-culturels",
            subcategories: [
              {
                name: "Patrimoine amazigh", slug: "patrimoine-amazigh",
                subcategories: [
                  { name: "Mariage amazigh",      slug: "mariage-amazigh" },
                  { name: "Musique amazigh",      slug: "musique-amazigh" },
                  { name: "Agriculture amazigh",  slug: "agriculture-amazigh" },
                  { name: "Architecture amazigh", slug: "architecture-amazigh" },
                  { name: "Maisons troglodytes",  slug: "maisons-troglodytes" },
                ],
              },
            ],
          },
        ],
      },

      // ══════════════════════════════════════════════════════════════════════
      // mainCategory: "evenements-et-traditions"
      // ══════════════════════════════════════════════════════════════════════
      {
        name:         "Événements et traditions",
        slug:         "evenements-et-traditions",
        mainCategory: "evenements-et-traditions",
        image:        "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=85",
        description:  "Produits et tenues pour cérémonies",
        subcategories: [
          {
            name: "Mariage amazigh", slug: "mariage-amazigh-evenements",
            subcategories: [
              {
                name: "Produits et accessoires", slug: "produits-et-accessoires-mariage",
                subcategories: [
                  { name: "Produits pour mariage amazigh", slug: "produits-mariage-amazigh" },
                  { name: "Accessoires pour fêtes",        slug: "accessoires-fetes" },
                  { name: "Tenues cérémoniales",           slug: "tenues-ceremoniales" },
                ],
              },
            ],
          },
        ],
      },

      // ══════════════════════════════════════════════════════════════════════
      // mainCategory: "tourisme-et-loisir"
      // ══════════════════════════════════════════════════════════════════════
      {
        name:         "Tourisme et loisir",
        slug:         "tourisme-et-loisir",
        mainCategory: "tourisme-et-loisir",
        image:        "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=85",
        description:  "Hébergements et expériences authentiques",
        subcategories: [
          {
            name: "Hébergements", slug: "hebergements",
            subcategories: [
              {
                name: "Types d'hébergements", slug: "types-dhebergements",
                subcategories: [
                  { name: "Maisons d'hôtes amazighes",       slug: "maisons-hotes-amazighes" },
                  { name: "Maisons d'hôtes traditionnelles", slug: "maisons-hotes-traditionnelles" },
                ],
              },
            ],
          },
        ],
      },

      // ══════════════════════════════════════════════════════════════════════
      // mainCategory: "langue-amazigh"
      // ══════════════════════════════════════════════════════════════════════
      {
        name:         "Langue amazigh",
        slug:         "langue-amazigh",
        mainCategory: "langue-amazigh",
        image:        "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=85",
        description:  "Ressources pour la langue amazigh",
        subcategories: [],
      },

      // ══════════════════════════════════════════════════════════════════════
      // mainCategory: "gda"
      // ══════════════════════════════════════════════════════════════════════
      {
        name:         "GDA",
        slug:         "gda",
        mainCategory: "gda",
        image:        "",
        description:  "",
        subcategories: [],
      },
>>>>>>> c702801961d86c6b8bcf35daa24685d65d39ef0d
    ];

    await Category.deleteMany({});
    const created = await Category.insertMany(defaultCategories);

    res.status(201).json({
      success: true,
      message: `${created.length} catégories créées avec succès`,
      data: created,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export {
  // root
  getCategories,
  getCategoryById,
  getCategoriesGrouped,
  createCategory,
  updateCategory,
  deleteCategory,
  // level 2
  addSubcategory,
  deleteSubcategory,
  // level 3
  addSubSubcategory,
  deleteSubSubcategory,
  // level 4
  addLevel4,
  deleteLevel4,
  // seed
  seedCategories,
};