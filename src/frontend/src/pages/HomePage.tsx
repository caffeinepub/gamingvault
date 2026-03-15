import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { Search, ShoppingCart, Terminal } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import MatrixRain from "../components/MatrixRain";
import PatreonBanner from "../components/PatreonBanner";
import { useGetAllProducts } from "../hooks/useQueries";

const SAMPLE_TAGS = ["FPS", "RPG", "Battle Royale", "MOBA", "MMO", "Sports"];
const SKELETON_KEYS = ["a", "b", "c", "d", "e", "f", "g", "h"];

function formatPrice(cents: bigint): string {
  return `$${(Number(cents) / 100).toFixed(2)}`;
}

export default function HomePage() {
  const [search, setSearch] = useState("");
  const { data: products = [], isLoading } = useGetAllProducts();

  const filtered = products.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      {/* Hero */}
      <section
        className="relative overflow-hidden border-b border-primary/20"
        data-ocid="home.section"
      >
        {/* Matrix rain background */}
        <MatrixRain className="absolute inset-0 w-full h-full opacity-30" />
        <div className="absolute inset-0 bg-background/80" />

        <div className="relative container mx-auto px-4 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border border-primary/40 bg-primary/10 text-primary text-sm font-mono mb-6"
              style={{ fontFamily: "'Share Tech Mono', monospace" }}
            >
              <Terminal className="w-3.5 h-3.5" />
              &gt;_ PREMIUM GAMING ACCOUNTS
            </div>
            <h1
              className="text-4xl md:text-6xl font-bold tracking-wider mb-4 text-primary"
              style={{ fontFamily: "'Share Tech Mono', monospace" }}
            >
              <span className="glitch glow-green-text">H4CK</span>
              <span className="text-foreground/70">.FST</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8 blink-cursor">
              Level up your game. Browse verified accounts. Instant delivery.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-lg mx-auto relative"
          >
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
            <Input
              placeholder="> search accounts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-12 text-base bg-card/80 border-primary/30 focus:border-primary font-mono placeholder:text-muted-foreground/60 glow-green"
              style={{ fontFamily: "'Share Tech Mono', monospace" }}
              data-ocid="home.search_input"
            />
          </motion.div>

          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {SAMPLE_TAGS.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="border-primary/30 text-primary text-xs font-mono hover:bg-primary/10 cursor-pointer transition-colors"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Patreon top banner */}
      <PatreonBanner variant="hero" />

      {/* Products Grid */}
      <section className="container mx-auto px-4 py-10">
        {isLoading ? (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
            data-ocid="products.loading_state"
          >
            {SKELETON_KEYS.map((k) => (
              <div key={k} className="space-y-3">
                <Skeleton className="h-40 w-full rounded" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-20 text-center"
            data-ocid="products.empty_state"
          >
            <div
              className="text-4xl text-primary/30 font-mono mb-4"
              style={{ fontFamily: "'Share Tech Mono', monospace" }}
            >
              {"> _"}
            </div>
            <h3
              className="text-lg font-semibold mb-1 text-primary"
              style={{ fontFamily: "'Share Tech Mono', monospace" }}
            >
              {search ? "// NO RESULTS FOUND" : "// NO PRODUCTS YET"}
            </h3>
            <p className="text-sm text-muted-foreground font-mono">
              {search
                ? `No accounts match "${search}"`
                : "Check back soon for new listings."}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2
                className="text-2xl font-bold text-primary"
                style={{ fontFamily: "'Share Tech Mono', monospace" }}
              >
                &gt;_ {search ? `results for "${search}"` : "all_accounts"}
                <span className="ml-2 text-base font-normal text-muted-foreground">
                  [{filtered.length}]
                </span>
              </h2>
            </div>
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
              data-ocid="products.list"
            >
              {filtered.map((product, index) => (
                <motion.div
                  key={product.id.toString()}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  data-ocid={`products.item.${index + 1}`}
                >
                  <Link
                    to="/product/$id"
                    params={{ id: product.id.toString() }}
                  >
                    <Card className="h-full bg-card border-primary/20 card-hover cursor-pointer rounded-sm">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="w-10 h-10 rounded-sm bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0 glow-green">
                            <Terminal className="w-5 h-5 text-primary" />
                          </div>
                          <Badge className="bg-primary/15 text-primary border-primary/40 text-xs font-mono rounded-sm">
                            {formatPrice(product.price)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <h3
                          className="font-semibold text-base mb-1 line-clamp-2 leading-snug text-foreground"
                          style={{ fontFamily: "'Share Tech Mono', monospace" }}
                        >
                          {product.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                          {product.description}
                        </p>
                      </CardContent>
                      <CardFooter>
                        <Button
                          size="sm"
                          className="w-full gap-1.5 border-primary/40 text-primary hover:bg-primary/20 rounded-sm font-mono text-xs"
                          variant="outline"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          &gt;_ VIEW DETAILS
                        </Button>
                      </CardFooter>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Mid-page Patreon banner */}
            {filtered.length > 3 && (
              <div className="mt-10">
                <PatreonBanner variant="inline" />
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
