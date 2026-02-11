// RIIQX Product Catalog — Live from Shopify Storefront API
// Fetches real products with images, prices, descriptions, and tags

const SHOPIFY_DOMAIN = "riiqx.myshopify.com";
const STOREFRONT_TOKEN = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN || "";
const GRAPHQL_URL = `https://${SHOPIFY_DOMAIN}/api/2024-01/graphql.json`;

// ─── Types ───────────────────────────────────────────────

export interface Product {
    id: string;
    title: string;
    description: string;
    price: number;
    currency: string;
    category: string;
    tags: string[];
    images: string[];
    shopUrl: string;
    handle: string;
}

// ─── GraphQL Query ───────────────────────────────────────

const PRODUCTS_QUERY = `
  query GetProducts($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          title
          handle
          description
          productType
          tags
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          images(first: 4) {
            edges {
              node {
                url
                altText
              }
            }
          }
        }
      }
    }
  }
`;

// ─── Fetch Products ──────────────────────────────────────

export async function fetchProducts(count: number = 50): Promise<Product[]> {
    if (!STOREFRONT_TOKEN) {
        console.warn("Shopify Storefront token not set, returning empty catalog");
        return [];
    }

    const res = await fetch(GRAPHQL_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
        },
        body: JSON.stringify({
            query: PRODUCTS_QUERY,
            variables: { first: count },
        }),
        next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!res.ok) {
        throw new Error(`Shopify API error: ${res.statusText}`);
    }

    const json = await res.json();
    const edges = json.data?.products?.edges || [];

    return edges.map(
        (edge: {
            node: {
                id: string;
                title: string;
                handle: string;
                description: string;
                productType: string;
                tags: string[];
                priceRange: {
                    minVariantPrice: { amount: string; currencyCode: string };
                };
                images: { edges: { node: { url: string; altText: string | null } }[] };
            };
        }) => {
            const p = edge.node;
            return {
                id: p.id.replace("gid://shopify/Product/", ""),
                title: p.title,
                handle: p.handle,
                description: p.description,
                price: Math.round(parseFloat(p.priceRange.minVariantPrice.amount)),
                currency: p.priceRange.minVariantPrice.currencyCode,
                category: p.productType || "Uncategorized",
                tags: p.tags,
                images: p.images.edges.map((img) => img.node.url),
                shopUrl: `https://${SHOPIFY_DOMAIN}/products/${p.handle}`,
            };
        }
    );
}

// ─── Get Single Product ──────────────────────────────────

export async function getProductById(
    productId: string
): Promise<Product | undefined> {
    const products = await fetchProducts();
    return products.find((p) => p.id === productId);
}

// ─── Get Random Product ──────────────────────────────────

export async function getRandomProduct(): Promise<Product> {
    const products = await fetchProducts();
    if (products.length === 0) throw new Error("No products found in Shopify");
    return products[Math.floor(Math.random() * products.length)];
}
