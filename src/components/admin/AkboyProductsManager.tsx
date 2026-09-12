import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, ExternalLink, GripVertical } from "lucide-react";
import { ImageUpload } from "@/components/admin/ImageUpload";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

interface FeatureRow {
  id?: string;
  title: string;
  description: string;
}
interface MediaRow {
  id?: string;
  url: string;
  caption: string;
}
interface StepRow {
  title: string;
  description: string;
}
interface FaqRow {
  question: string;
  answer: string;
}

const emptyForm = {
  name: "",
  slug: "",
  category: "",
  tagline: "",
  short_description: "",
  full_description: "",
  status: "in_development",
  problem: "",
  solution: "",
  audience: "",
  video_url: "",
  logo_url: "",
  cover_image_url: "",
  cta_text: "",
  cta_url: "",
  is_featured: false,
  display_order: 0,
  is_published: false,
  seo_title: "",
  seo_description: "",
  seo_image_url: "",
};

export function AkboyProductsManager() {
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ ...emptyForm });
  const [features, setFeatures] = useState<FeatureRow[]>([]);
  const [media, setMedia] = useState<MediaRow[]>([]);
  const [steps, setSteps] = useState<StepRow[]>([]);
  const [faqs, setFaqs] = useState<FaqRow[]>([]);

  const load = async () => {
    const { data, error } = await supabase
      .from("akboy_products")
      .select("*")
      .order("display_order", { ascending: true });
    if (error) toast({ title: "Could not load products", description: error.message, variant: "destructive" });
    setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const reset = () => {
    setForm({ ...emptyForm });
    setFeatures([]);
    setMedia([]);
    setSteps([]);
    setFaqs([]);
    setEditingId(null);
  };

  const startEdit = async (p: any) => {
    setEditingId(p.id);
    setForm({
      name: p.name || "",
      slug: p.slug || "",
      category: p.category || "",
      tagline: p.tagline || "",
      short_description: p.short_description || "",
      full_description: p.full_description || "",
      status: p.status || "in_development",
      problem: p.problem || "",
      solution: p.solution || "",
      audience: p.audience || "",
      video_url: p.video_url || "",
      logo_url: p.logo_url || "",
      cover_image_url: p.cover_image_url || "",
      cta_text: p.cta_text || "",
      cta_url: p.cta_url || "",
      is_featured: !!p.is_featured,
      display_order: p.display_order ?? 0,
      is_published: !!p.is_published,
      seo_title: p.seo_title || "",
      seo_description: p.seo_description || "",
      seo_image_url: p.seo_image_url || "",
    });
    setSteps(Array.isArray(p.how_it_works) ? p.how_it_works : []);
    setFaqs(Array.isArray(p.faqs) ? p.faqs : []);

    const [f, m] = await Promise.all([
      supabase.from("akboy_product_features").select("*").eq("product_id", p.id).order("display_order"),
      supabase.from("akboy_product_media").select("*").eq("product_id", p.id).order("display_order"),
    ]);
    setFeatures(((f.data as any[]) || []).map((x) => ({ id: x.id, title: x.title, description: x.description || "" })));
    setMedia(((m.data as any[]) || []).map((x) => ({ id: x.id, url: x.url, caption: x.caption || "" })));
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        slug: form.slug ? slugify(form.slug) : slugify(form.name),
        how_it_works: steps.filter((s) => s.title.trim()),
        faqs: faqs.filter((f) => f.question.trim()),
      };

      let productId = editingId;
      if (editingId) {
        const { error } = await supabase.from("akboy_products").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("akboy_products").insert(payload).select("id").single();
        if (error) throw error;
        productId = data.id;
      }

      // Replace features and media
      await supabase.from("akboy_product_features").delete().eq("product_id", productId!);
      const cleanFeatures = features.filter((f) => f.title.trim());
      if (cleanFeatures.length) {
        const { error } = await supabase.from("akboy_product_features").insert(
          cleanFeatures.map((f, i) => ({
            product_id: productId!,
            title: f.title,
            description: f.description || null,
            display_order: i,
          }))
        );
        if (error) throw error;
      }

      await supabase.from("akboy_product_media").delete().eq("product_id", productId!);
      const cleanMedia = media.filter((m) => m.url.trim());
      if (cleanMedia.length) {
        const { error } = await supabase.from("akboy_product_media").insert(
          cleanMedia.map((m, i) => ({
            product_id: productId!,
            url: m.url,
            caption: m.caption || null,
            media_type: "image",
            display_order: i,
          }))
        );
        if (error) throw error;
      }

      toast({ title: editingId ? "Product updated" : "Product created" });
      setOpen(false);
      reset();
      load();
    } catch (err: any) {
      toast({ title: "Could not save product", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (p: any) => {
    const { error } = await supabase.from("akboy_products").update({ is_published: !p.is_published }).eq("id", p.id);
    if (error) return toast({ title: "Update failed", description: error.message, variant: "destructive" });
    toast({ title: p.is_published ? "Product unpublished" : "Product published" });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this product and all of its features and screenshots?")) return;
    const { error } = await supabase.from("akboy_products").delete().eq("id", id);
    if (error) return toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    toast({ title: "Product deleted" });
    load();
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading products…</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Products</h2>
          <p className="text-sm text-muted-foreground">Manage the product pages on the AKBOY website.</p>
        </div>
        <Button
          onClick={() => {
            reset();
            setOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>

      <div className="grid gap-4">
        {products.length === 0 && (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            No products yet. Add Edura and School OS to get started.
          </Card>
        )}
        {products.map((p) => (
          <Card key={p.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 gap-4">
                {p.logo_url && <img src={p.logo_url} alt="" className="h-12 w-12 rounded object-contain" />}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{p.name}</h3>
                    <Badge variant={p.is_published ? "default" : "secondary"}>
                      {p.is_published ? "Published" : "Draft"}
                    </Badge>
                    {p.is_featured && <Badge variant="outline">Featured</Badge>}
                    <Badge variant="outline">{p.status?.replace("_", " ")}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">/products/{p.slug}</p>
                  {p.short_description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.short_description}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" asChild>
                  <a href={`/akboy/products/${p.slug}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                <Button size="sm" variant="outline" onClick={() => togglePublish(p)}>
                  {p.is_published ? "Unpublish" : "Publish"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => startEdit(p)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="destructive" onClick={() => remove(p.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) reset();
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit product" : "Add product"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={save} className="space-y-6">
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Basic information</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Name *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        name: e.target.value,
                        slug: editingId ? form.slug : slugify(e.target.value),
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <Label>Slug (page address)</Label>
                  <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
                </div>
                <div>
                  <Label>Category</Label>
                  <Input
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="e.g. Assessment, School operations"
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="live">Live</SelectItem>
                      <SelectItem value="in_development">In Development</SelectItem>
                      <SelectItem value="coming_soon">Coming Soon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Tagline</Label>
                <Input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
              </div>
              <div>
                <Label>Short description</Label>
                <Textarea
                  rows={2}
                  value={form.short_description}
                  onChange={(e) => setForm({ ...form, short_description: e.target.value })}
                />
              </div>
              <div>
                <Label>Full description</Label>
                <Textarea
                  rows={4}
                  value={form.full_description}
                  onChange={(e) => setForm({ ...form, full_description: e.target.value })}
                />
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Visuals</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Logo</Label>
                  <ImageUpload
                    value={form.logo_url}
                    onChange={(url) => setForm({ ...form, logo_url: url })}
                    folder="products"
                    label="Product logo"
                  />
                </div>
                <div>
                  <Label>Cover image</Label>
                  <ImageUpload
                    value={form.cover_image_url}
                    onChange={(url) => setForm({ ...form, cover_image_url: url })}
                    folder="products"
                    label="Cover image"
                  />
                </div>
              </div>

              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <Label>Screenshots</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setMedia([...media, { url: "", caption: "" }])}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" /> Add Screenshot
                  </Button>
                </div>
                {media.map((m, i) => (
                  <div key={i} className="space-y-2 rounded-md border p-3">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-xs text-muted-foreground">
                        <GripVertical className="h-3.5 w-3.5" /> Screenshot {i + 1}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setMedia(media.filter((_, x) => x !== i))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <ImageUpload
                      value={m.url}
                      onChange={(url) => setMedia(media.map((x, xi) => (xi === i ? { ...x, url } : x)))}
                      folder="products"
                      label="Screenshot"
                    />
                    <Input
                      placeholder="Caption (optional)"
                      value={m.caption}
                      onChange={(e) =>
                        setMedia(media.map((x, xi) => (xi === i ? { ...x, caption: e.target.value } : x)))
                      }
                    />
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Content</h3>
              <div>
                <Label>The problem</Label>
                <Textarea rows={3} value={form.problem} onChange={(e) => setForm({ ...form, problem: e.target.value })} />
              </div>
              <div>
                <Label>The solution</Label>
                <Textarea
                  rows={3}
                  value={form.solution}
                  onChange={(e) => setForm({ ...form, solution: e.target.value })}
                />
              </div>
              <div>
                <Label>Who it is for</Label>
                <Textarea
                  rows={3}
                  value={form.audience}
                  onChange={(e) => setForm({ ...form, audience: e.target.value })}
                />
              </div>

              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <Label>Features</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setFeatures([...features, { title: "", description: "" }])}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" /> Add Feature
                  </Button>
                </div>
                {features.map((f, i) => (
                  <div key={i} className="space-y-2 rounded-md border p-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Feature title"
                        value={f.title}
                        onChange={(e) =>
                          setFeatures(features.map((x, xi) => (xi === i ? { ...x, title: e.target.value } : x)))
                        }
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setFeatures(features.filter((_, x) => x !== i))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea
                      rows={2}
                      placeholder="Feature description"
                      value={f.description}
                      onChange={(e) =>
                        setFeatures(features.map((x, xi) => (xi === i ? { ...x, description: e.target.value } : x)))
                      }
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <Label>How it works (steps)</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setSteps([...steps, { title: "", description: "" }])}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" /> Add Step
                  </Button>
                </div>
                {steps.map((s, i) => (
                  <div key={i} className="space-y-2 rounded-md border p-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder={`Step ${i + 1} title`}
                        value={s.title}
                        onChange={(e) =>
                          setSteps(steps.map((x, xi) => (xi === i ? { ...x, title: e.target.value } : x)))
                        }
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setSteps(steps.filter((_, x) => x !== i))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea
                      rows={2}
                      placeholder="Step description"
                      value={s.description}
                      onChange={(e) =>
                        setSteps(steps.map((x, xi) => (xi === i ? { ...x, description: e.target.value } : x)))
                      }
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <Label>FAQs</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setFaqs([...faqs, { question: "", answer: "" }])}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" /> Add FAQ
                  </Button>
                </div>
                {faqs.map((f, i) => (
                  <div key={i} className="space-y-2 rounded-md border p-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Question"
                        value={f.question}
                        onChange={(e) =>
                          setFaqs(faqs.map((x, xi) => (xi === i ? { ...x, question: e.target.value } : x)))
                        }
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setFaqs(faqs.filter((_, x) => x !== i))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea
                      rows={2}
                      placeholder="Answer"
                      value={f.answer}
                      onChange={(e) => setFaqs(faqs.map((x, xi) => (xi === i ? { ...x, answer: e.target.value } : x)))}
                    />
                  </div>
                ))}
              </div>

              <div>
                <Label>Demo video URL (embed link)</Label>
                <Input value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} />
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Call to action</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Button text</Label>
                  <Input
                    value={form.cta_text}
                    onChange={(e) => setForm({ ...form, cta_text: e.target.value })}
                    placeholder="Visit Product / Join Waitlist"
                  />
                </div>
                <div>
                  <Label>Button link</Label>
                  <Input
                    value={form.cta_url}
                    onChange={(e) => setForm({ ...form, cta_url: e.target.value })}
                    placeholder="https://edura.com.ng"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Publishing & SEO</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Display order</Label>
                  <Input
                    type="number"
                    value={form.display_order}
                    onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-end gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={form.is_featured}
                      onCheckedChange={(v) => setForm({ ...form, is_featured: v })}
                    />
                    <Label>Featured</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={form.is_published}
                      onCheckedChange={(v) => setForm({ ...form, is_published: v })}
                    />
                    <Label>Published</Label>
                  </div>
                </div>
              </div>
              <div>
                <Label>SEO title</Label>
                <Input value={form.seo_title} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} />
              </div>
              <div>
                <Label>Meta description</Label>
                <Textarea
                  rows={2}
                  value={form.seo_description}
                  onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
                />
              </div>
              <div>
                <Label>Social image</Label>
                <ImageUpload
                  value={form.seo_image_url}
                  onChange={(url) => setForm({ ...form, seo_image_url: url })}
                  folder="products"
                  label="Social image"
                />
              </div>
            </section>

            <div className="flex justify-end gap-2 pb-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : editingId ? "Save changes" : "Create product"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
