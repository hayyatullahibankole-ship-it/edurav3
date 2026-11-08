# Project architecture rules

- Admin-only reads of Supabase Auth metadata must go through an admin-verified Edge Function that returns only fields required by the interface; browser code must not access Auth admin APIs because sign-in metadata is sensitive.