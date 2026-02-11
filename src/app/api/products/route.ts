import { NextResponse } from "next/server";
import { fetchProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const products = await fetchProducts();
        return NextResponse.json({ products, count: products.length });
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Failed to fetch products";
        console.error("[PRODUCTS_ERROR]", message);
        return NextResponse.json({ error: message, products: [] }, { status: 500 });
    }
}
