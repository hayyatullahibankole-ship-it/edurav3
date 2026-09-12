export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          badge_color: string | null
          badge_icon: string | null
          category: string | null
          created_at: string | null
          criteria: Json
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          points_value: number | null
        }
        Insert: {
          badge_color?: string | null
          badge_icon?: string | null
          category?: string | null
          created_at?: string | null
          criteria: Json
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          points_value?: number | null
        }
        Update: {
          badge_color?: string | null
          badge_icon?: string | null
          category?: string | null
          created_at?: string | null
          criteria?: Json
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          points_value?: number | null
        }
        Relationships: []
      }
      ai_tutor_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          images: Json
          role: string
          thread_id: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          images?: Json
          role: string
          thread_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          images?: Json
          role?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_tutor_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "ai_tutor_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_tutor_threads: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      akboy_ambassadors: {
        Row: {
          bio: string | null
          cohort: string | null
          created_at: string
          display_order: number
          full_name: string
          id: string
          is_active: boolean
          is_featured: boolean
          is_published: boolean
          photo_url: string | null
          role_title: string | null
          school: string | null
          social_links: Json
          updated_at: string
        }
        Insert: {
          bio?: string | null
          cohort?: string | null
          created_at?: string
          display_order?: number
          full_name: string
          id?: string
          is_active?: boolean
          is_featured?: boolean
          is_published?: boolean
          photo_url?: string | null
          role_title?: string | null
          school?: string | null
          social_links?: Json
          updated_at?: string
        }
        Update: {
          bio?: string | null
          cohort?: string | null
          created_at?: string
          display_order?: number
          full_name?: string
          id?: string
          is_active?: boolean
          is_featured?: boolean
          is_published?: boolean
          photo_url?: string | null
          role_title?: string | null
          school?: string | null
          social_links?: Json
          updated_at?: string
        }
        Relationships: []
      }
      akboy_event_ambassadors: {
        Row: {
          ambassador_id: string
          created_at: string
          event_id: string
          id: string
        }
        Insert: {
          ambassador_id: string
          created_at?: string
          event_id: string
          id?: string
        }
        Update: {
          ambassador_id?: string
          created_at?: string
          event_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "akboy_event_ambassadors_ambassador_id_fkey"
            columns: ["ambassador_id"]
            isOneToOne: false
            referencedRelation: "akboy_ambassadors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "akboy_event_ambassadors_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "akboy_events"
            referencedColumns: ["id"]
          },
        ]
      }
      akboy_event_media: {
        Row: {
          caption: string | null
          created_at: string
          display_order: number
          event_id: string
          id: string
          media_type: string
          url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          display_order?: number
          event_id: string
          id?: string
          media_type?: string
          url: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          display_order?: number
          event_id?: string
          id?: string
          media_type?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "akboy_event_media_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "akboy_events"
            referencedColumns: ["id"]
          },
        ]
      }
      akboy_event_registrations: {
        Row: {
          created_at: string
          email: string | null
          event_id: string
          full_name: string
          id: string
          phone: string | null
          responses: Json
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          event_id: string
          full_name: string
          id?: string
          phone?: string | null
          responses?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          event_id?: string
          full_name?: string
          id?: string
          phone?: string | null
          responses?: Json
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "akboy_event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "akboy_events"
            referencedColumns: ["id"]
          },
        ]
      }
      akboy_event_schools: {
        Row: {
          created_at: string
          event_id: string
          id: string
          school_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          school_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "akboy_event_schools_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "akboy_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "akboy_event_schools_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "akboy_partner_schools"
            referencedColumns: ["id"]
          },
        ]
      }
      akboy_event_speakers: {
        Row: {
          bio: string | null
          created_at: string
          display_order: number
          event_id: string
          full_name: string
          id: string
          organization: string | null
          photo_url: string | null
          position_title: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          display_order?: number
          event_id: string
          full_name: string
          id?: string
          organization?: string | null
          photo_url?: string | null
          position_title?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          display_order?: number
          event_id?: string
          full_name?: string
          id?: string
          organization?: string | null
          photo_url?: string | null
          position_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "akboy_event_speakers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "akboy_events"
            referencedColumns: ["id"]
          },
        ]
      }
      akboy_events: {
        Row: {
          attendance_count: number | null
          created_at: string | null
          current_participants: number | null
          description: string | null
          end_date: string | null
          end_time: string | null
          event_date: string | null
          event_type: string | null
          form_fields: Json
          highlights: Json
          id: string
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean
          is_published: boolean
          location: string | null
          max_participants: number | null
          outcomes: string | null
          price: number | null
          registration_url: string | null
          schedule: Json
          slug: string | null
          start_time: string | null
          status: string
          theme: string | null
          title: string
          updated_at: string | null
          venue: string | null
          who_its_for: string | null
          why_we_do_this: string | null
        }
        Insert: {
          attendance_count?: number | null
          created_at?: string | null
          current_participants?: number | null
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          event_date?: string | null
          event_type?: string | null
          form_fields?: Json
          highlights?: Json
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean
          is_published?: boolean
          location?: string | null
          max_participants?: number | null
          outcomes?: string | null
          price?: number | null
          registration_url?: string | null
          schedule?: Json
          slug?: string | null
          start_time?: string | null
          status?: string
          theme?: string | null
          title: string
          updated_at?: string | null
          venue?: string | null
          who_its_for?: string | null
          why_we_do_this?: string | null
        }
        Update: {
          attendance_count?: number | null
          created_at?: string | null
          current_participants?: number | null
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          event_date?: string | null
          event_type?: string | null
          form_fields?: Json
          highlights?: Json
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean
          is_published?: boolean
          location?: string | null
          max_participants?: number | null
          outcomes?: string | null
          price?: number | null
          registration_url?: string | null
          schedule?: Json
          slug?: string | null
          start_time?: string | null
          status?: string
          theme?: string | null
          title?: string
          updated_at?: string | null
          venue?: string | null
          who_its_for?: string | null
          why_we_do_this?: string | null
        }
        Relationships: []
      }
      akboy_faqs: {
        Row: {
          answer: string
          category: string | null
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          question: string
          updated_at: string | null
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          question: string
          updated_at?: string | null
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          question?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      akboy_homepage_settings: {
        Row: {
          created_at: string
          featured_event_id: string | null
          id: string
          impact_stats: Json
          show_community: boolean
          show_featured_event: boolean
          show_impact: boolean
          show_partner_strip: boolean
          show_products: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          featured_event_id?: string | null
          id?: string
          impact_stats?: Json
          show_community?: boolean
          show_featured_event?: boolean
          show_impact?: boolean
          show_partner_strip?: boolean
          show_products?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          featured_event_id?: string | null
          id?: string
          impact_stats?: Json
          show_community?: boolean
          show_featured_event?: boolean
          show_impact?: boolean
          show_partner_strip?: boolean
          show_products?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "akboy_homepage_settings_featured_event_id_fkey"
            columns: ["featured_event_id"]
            isOneToOne: false
            referencedRelation: "akboy_events"
            referencedColumns: ["id"]
          },
        ]
      }
      akboy_inquiries: {
        Row: {
          created_at: string | null
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          responded_at: string | null
          responded_by: string | null
          response: string | null
          status: string | null
          subject: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          responded_at?: string | null
          responded_by?: string | null
          response?: string | null
          status?: string | null
          subject: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          responded_at?: string | null
          responded_by?: string | null
          response?: string | null
          status?: string | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "akboy_inquiries_responded_by_fkey"
            columns: ["responded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      akboy_partner_schools: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          is_featured: boolean
          is_published: boolean
          location: string | null
          logo_url: string | null
          name: string
          partnership_start_date: string | null
          partnership_type: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          is_featured?: boolean
          is_published?: boolean
          location?: string | null
          logo_url?: string | null
          name: string
          partnership_start_date?: string | null
          partnership_type?: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          is_featured?: boolean
          is_published?: boolean
          location?: string | null
          logo_url?: string | null
          name?: string
          partnership_start_date?: string | null
          partnership_type?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      akboy_portfolio: {
        Row: {
          category: string
          client_name: string | null
          completion_date: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          images: Json | null
          is_active: boolean | null
          is_featured: boolean | null
          project_url: string | null
          tags: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          client_name?: string | null
          completion_date?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          images?: Json | null
          is_active?: boolean | null
          is_featured?: boolean | null
          project_url?: string | null
          tags?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          client_name?: string | null
          completion_date?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          images?: Json | null
          is_active?: boolean | null
          is_featured?: boolean | null
          project_url?: string | null
          tags?: Json | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      akboy_product_features: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          icon: string | null
          id: string
          product_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          product_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          product_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "akboy_product_features_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "akboy_products"
            referencedColumns: ["id"]
          },
        ]
      }
      akboy_product_media: {
        Row: {
          caption: string | null
          created_at: string
          display_order: number
          id: string
          media_type: string
          product_id: string
          url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          display_order?: number
          id?: string
          media_type?: string
          product_id: string
          url: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          display_order?: number
          id?: string
          media_type?: string
          product_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "akboy_product_media_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "akboy_products"
            referencedColumns: ["id"]
          },
        ]
      }
      akboy_products: {
        Row: {
          audience: string | null
          category: string | null
          cover_image_url: string | null
          created_at: string
          cta_text: string | null
          cta_url: string | null
          display_order: number
          faqs: Json
          full_description: string | null
          how_it_works: Json
          id: string
          is_featured: boolean
          is_published: boolean
          logo_url: string | null
          name: string
          problem: string | null
          seo_description: string | null
          seo_image_url: string | null
          seo_title: string | null
          short_description: string | null
          slug: string
          solution: string | null
          status: string
          tagline: string | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          audience?: string | null
          category?: string | null
          cover_image_url?: string | null
          created_at?: string
          cta_text?: string | null
          cta_url?: string | null
          display_order?: number
          faqs?: Json
          full_description?: string | null
          how_it_works?: Json
          id?: string
          is_featured?: boolean
          is_published?: boolean
          logo_url?: string | null
          name: string
          problem?: string | null
          seo_description?: string | null
          seo_image_url?: string | null
          seo_title?: string | null
          short_description?: string | null
          slug: string
          solution?: string | null
          status?: string
          tagline?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          audience?: string | null
          category?: string | null
          cover_image_url?: string | null
          created_at?: string
          cta_text?: string | null
          cta_url?: string | null
          display_order?: number
          faqs?: Json
          full_description?: string | null
          how_it_works?: Json
          id?: string
          is_featured?: boolean
          is_published?: boolean
          logo_url?: string | null
          name?: string
          problem?: string | null
          seo_description?: string | null
          seo_image_url?: string | null
          seo_title?: string | null
          short_description?: string | null
          slug?: string
          solution?: string | null
          status?: string
          tagline?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      akboy_services: {
        Row: {
          category: string | null
          created_at: string | null
          display_order: number | null
          features: Json | null
          full_description: string | null
          icon_name: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          pricing_info: string | null
          short_description: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          display_order?: number | null
          features?: Json | null
          full_description?: string | null
          icon_name?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          pricing_info?: string | null
          short_description?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          display_order?: number | null
          features?: Json | null
          full_description?: string | null
          icon_name?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          pricing_info?: string | null
          short_description?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      akboy_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value?: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      akboy_stats: {
        Row: {
          display_order: number | null
          icon_name: string | null
          id: string
          is_active: boolean | null
          label: string
          updated_at: string | null
          value: string
        }
        Insert: {
          display_order?: number | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          updated_at?: string | null
          value: string
        }
        Update: {
          display_order?: number | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      akboy_team: {
        Row: {
          bio: string | null
          created_at: string | null
          display_order: number | null
          email: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          role: string
          social_links: Json | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          display_order?: number | null
          email?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          role: string
          social_links?: Json | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          display_order?: number | null
          email?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          role?: string
          social_links?: Json | null
        }
        Relationships: []
      }
      akboy_testimonials: {
        Row: {
          client_name: string
          company: string | null
          content: string
          created_at: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          rating: number | null
          role: string | null
        }
        Insert: {
          client_name: string
          company?: string | null
          content: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          rating?: number | null
          role?: string | null
        }
        Update: {
          client_name?: string
          company?: string | null
          content?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          rating?: number | null
          role?: string | null
        }
        Relationships: []
      }
      akboy_tutorial_registrations: {
        Row: {
          academic_level: string | null
          created_at: string | null
          email: string | null
          full_name: string
          gender: string | null
          guardian_name: string | null
          guardian_phone: string | null
          id: string
          mode_of_learning: string
          notes: string | null
          payment_proof_url: string | null
          payment_verified: boolean | null
          payment_verified_at: string | null
          payment_verified_by: string | null
          phone: string
          price: number
          referral_source: string | null
          special_requests: string | null
          status: string | null
          student_photo_url: string | null
          tutorial_id: string | null
          tutorial_name: string
          tutorial_type: string
          updated_at: string | null
        }
        Insert: {
          academic_level?: string | null
          created_at?: string | null
          email?: string | null
          full_name: string
          gender?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          mode_of_learning: string
          notes?: string | null
          payment_proof_url?: string | null
          payment_verified?: boolean | null
          payment_verified_at?: string | null
          payment_verified_by?: string | null
          phone: string
          price: number
          referral_source?: string | null
          special_requests?: string | null
          status?: string | null
          student_photo_url?: string | null
          tutorial_id?: string | null
          tutorial_name: string
          tutorial_type: string
          updated_at?: string | null
        }
        Update: {
          academic_level?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          gender?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          mode_of_learning?: string
          notes?: string | null
          payment_proof_url?: string | null
          payment_verified?: boolean | null
          payment_verified_at?: string | null
          payment_verified_by?: string | null
          phone?: string
          price?: number
          referral_source?: string | null
          special_requests?: string | null
          status?: string | null
          student_photo_url?: string | null
          tutorial_id?: string | null
          tutorial_name?: string
          tutorial_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "akboy_tutorial_registrations_tutorial_id_fkey"
            columns: ["tutorial_id"]
            isOneToOne: false
            referencedRelation: "akboy_tutorials"
            referencedColumns: ["id"]
          },
        ]
      }
      akboy_tutorials: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          flyer_url: string | null
          id: string
          is_active: boolean | null
          name: string
          online_group_price: number | null
          online_private_price: number | null
          physical_group_price: number | null
          physical_private_price: number | null
          slug: string
          updated_at: string | null
          whatsapp_group_link: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          flyer_url?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          online_group_price?: number | null
          online_private_price?: number | null
          physical_group_price?: number | null
          physical_private_price?: number | null
          slug: string
          updated_at?: string | null
          whatsapp_group_link?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          flyer_url?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          online_group_price?: number | null
          online_private_price?: number | null
          physical_group_price?: number | null
          physical_private_price?: number | null
          slug?: string
          updated_at?: string | null
          whatsapp_group_link?: string | null
        }
        Relationships: []
      }
      attempt_answers: {
        Row: {
          answer: Json | null
          answered_at: string | null
          attempt_id: string | null
          id: string
          is_correct: boolean | null
          is_flagged: boolean | null
          question_id: string | null
          time_spent_seconds: number | null
        }
        Insert: {
          answer?: Json | null
          answered_at?: string | null
          attempt_id?: string | null
          id?: string
          is_correct?: boolean | null
          is_flagged?: boolean | null
          question_id?: string | null
          time_spent_seconds?: number | null
        }
        Update: {
          answer?: Json | null
          answered_at?: string | null
          attempt_id?: string | null
          id?: string
          is_correct?: boolean | null
          is_flagged?: boolean | null
          question_id?: string | null
          time_spent_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "attempt_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempt_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      attempts: {
        Row: {
          created_at: string | null
          device_fingerprint: string | null
          exam_id: string | null
          id: string
          ip_address: unknown
          proctoring_data: Json | null
          selected_subjects: Json | null
          started_at: string | null
          status: Database["public"]["Enums"]["attempt_status"] | null
          submitted_at: string | null
          suspicious_activity_count: number | null
          time_remaining_seconds: number | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          device_fingerprint?: string | null
          exam_id?: string | null
          id?: string
          ip_address?: unknown
          proctoring_data?: Json | null
          selected_subjects?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["attempt_status"] | null
          submitted_at?: string | null
          suspicious_activity_count?: number | null
          time_remaining_seconds?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          device_fingerprint?: string | null
          exam_id?: string | null
          id?: string
          ip_address?: unknown
          proctoring_data?: Json | null
          selected_subjects?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["attempt_status"] | null
          submitted_at?: string | null
          suspicious_activity_count?: number | null
          time_remaining_seconds?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attempts_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action_type: string
          actor_user_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown
          target_id: string | null
          target_type: string | null
          user_agent: string | null
        }
        Insert: {
          action_type: string
          actor_user_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action_type?: string
          actor_user_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      beta_reports: {
        Row: {
          created_at: string
          day_number: number
          device_info: string | null
          id: string
          issues: string | null
          rating: number
          screenshots: string[]
          suggestions: string | null
          tester_id: string
          updated_at: string
          what_worked: string | null
        }
        Insert: {
          created_at?: string
          day_number: number
          device_info?: string | null
          id?: string
          issues?: string | null
          rating?: number
          screenshots?: string[]
          suggestions?: string | null
          tester_id: string
          updated_at?: string
          what_worked?: string | null
        }
        Update: {
          created_at?: string
          day_number?: number
          device_info?: string | null
          id?: string
          issues?: string | null
          rating?: number
          screenshots?: string[]
          suggestions?: string | null
          tester_id?: string
          updated_at?: string
          what_worked?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "beta_reports_tester_id_fkey"
            columns: ["tester_id"]
            isOneToOne: false
            referencedRelation: "beta_testers"
            referencedColumns: ["id"]
          },
        ]
      }
      beta_settings: {
        Row: {
          created_at: string
          day_number: number
          focus_note: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_number: number
          focus_note?: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_number?: number
          focus_note?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      beta_testers: {
        Row: {
          code: string
          created_at: string
          device_fingerprint: string | null
          email: string | null
          id: string
          last_active_at: string | null
          name: string | null
          notes: string | null
          phone: string | null
          redeemed_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          device_fingerprint?: string | null
          email?: string | null
          id?: string
          last_active_at?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          redeemed_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          device_fingerprint?: string | null
          email?: string | null
          id?: string
          last_active_at?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          redeemed_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string | null
          category: string | null
          content: string
          created_at: string | null
          excerpt: string | null
          featured_image_url: string | null
          id: string
          institution_type: string | null
          is_featured: boolean | null
          is_published: boolean | null
          published_at: string | null
          school: string | null
          slug: string
          tags: Json | null
          title: string
          updated_at: string | null
          view_count: number | null
          year: number | null
        }
        Insert: {
          author_id?: string | null
          category?: string | null
          content: string
          created_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          institution_type?: string | null
          is_featured?: boolean | null
          is_published?: boolean | null
          published_at?: string | null
          school?: string | null
          slug: string
          tags?: Json | null
          title: string
          updated_at?: string | null
          view_count?: number | null
          year?: number | null
        }
        Update: {
          author_id?: string | null
          category?: string | null
          content?: string
          created_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          institution_type?: string | null
          is_featured?: boolean | null
          is_published?: boolean | null
          published_at?: string | null
          school?: string | null
          slug?: string
          tags?: Json | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
          year?: number | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          is_paid: boolean | null
          meeting_link: string | null
          notes: string | null
          payment_reference: string | null
          price: number | null
          start_time: string
          status: Database["public"]["Enums"]["booking_status"] | null
          subject_id: string | null
          title: string | null
          tutor_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_paid?: boolean | null
          meeting_link?: string | null
          notes?: string | null
          payment_reference?: string | null
          price?: number | null
          start_time: string
          status?: Database["public"]["Enums"]["booking_status"] | null
          subject_id?: string | null
          title?: string | null
          tutor_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_paid?: boolean | null
          meeting_link?: string | null
          notes?: string | null
          payment_reference?: string | null
          price?: number | null
          start_time?: string
          status?: Database["public"]["Enums"]["booking_status"] | null
          subject_id?: string | null
          title?: string | null
          tutor_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      campus_ai_sessions: {
        Row: {
          content: string
          course_id: string | null
          created_at: string
          id: string
          kind: string
          project_id: string | null
          prompt: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          course_id?: string | null
          created_at?: string
          id?: string
          kind: string
          project_id?: string | null
          prompt?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          course_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          project_id?: string | null
          prompt?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campus_ai_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "campus_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campus_ai_sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "campus_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      campus_ai_usage: {
        Row: {
          count: number
          created_at: string
          day: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          count?: number
          created_at?: string
          day?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          count?: number
          created_at?: string
          day?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      campus_courses: {
        Row: {
          code: string
          color: string
          created_at: string
          grade: string | null
          id: string
          lecturer: string | null
          semester: string
          session: string | null
          title: string
          units: number
          updated_at: string
          user_id: string
        }
        Insert: {
          code: string
          color?: string
          created_at?: string
          grade?: string | null
          id?: string
          lecturer?: string | null
          semester?: string
          session?: string | null
          title: string
          units?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          code?: string
          color?: string
          created_at?: string
          grade?: string | null
          id?: string
          lecturer?: string | null
          semester?: string
          session?: string | null
          title?: string
          units?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      campus_cv_profiles: {
        Row: {
          certifications: Json
          created_at: string
          education: Json
          email: string | null
          experience: Json
          full_name: string | null
          headline: string | null
          id: string
          links: Json
          location: string | null
          phone: string | null
          projects: Json
          skills: Json
          summary: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          certifications?: Json
          created_at?: string
          education?: Json
          email?: string | null
          experience?: Json
          full_name?: string | null
          headline?: string | null
          id?: string
          links?: Json
          location?: string | null
          phone?: string | null
          projects?: Json
          skills?: Json
          summary?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          certifications?: Json
          created_at?: string
          education?: Json
          email?: string | null
          experience?: Json
          full_name?: string | null
          headline?: string | null
          id?: string
          links?: Json
          location?: string | null
          phone?: string | null
          projects?: Json
          skills?: Json
          summary?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      campus_generated_questions: {
        Row: {
          answer: string | null
          created_at: string
          explanation: string | null
          id: string
          options: Json
          position: number
          question: string
          set_id: string
          user_id: string
        }
        Insert: {
          answer?: string | null
          created_at?: string
          explanation?: string | null
          id?: string
          options?: Json
          position?: number
          question: string
          set_id: string
          user_id: string
        }
        Update: {
          answer?: string | null
          created_at?: string
          explanation?: string | null
          id?: string
          options?: Json
          position?: number
          question?: string
          set_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campus_generated_questions_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "campus_question_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      campus_hub_consultations: {
        Row: {
          created_at: string
          current_level: string | null
          email: string
          id: string
          jamb_score: number | null
          message: string | null
          name: string
          status: string
          target_course: string | null
          target_school: string | null
          whatsapp: string
        }
        Insert: {
          created_at?: string
          current_level?: string | null
          email: string
          id?: string
          jamb_score?: number | null
          message?: string | null
          name: string
          status?: string
          target_course?: string | null
          target_school?: string | null
          whatsapp: string
        }
        Update: {
          created_at?: string
          current_level?: string | null
          email?: string
          id?: string
          jamb_score?: number | null
          message?: string | null
          name?: string
          status?: string
          target_course?: string | null
          target_school?: string | null
          whatsapp?: string
        }
        Relationships: []
      }
      campus_hub_subscribers: {
        Row: {
          created_at: string
          email: string | null
          id: string
          interests: string[] | null
          level: string | null
          school: string | null
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          interests?: string[] | null
          level?: string | null
          school?: string | null
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          interests?: string[] | null
          level?: string | null
          school?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      campus_logbook_entries: {
        Row: {
          activities: string
          challenges: string | null
          created_at: string
          entry_date: string
          hours: number | null
          id: string
          kind: string
          placement_id: string | null
          skills_learned: string | null
          supervisor_comment: string | null
          title: string | null
          updated_at: string
          user_id: string
          week_number: number | null
        }
        Insert: {
          activities?: string
          challenges?: string | null
          created_at?: string
          entry_date?: string
          hours?: number | null
          id?: string
          kind?: string
          placement_id?: string | null
          skills_learned?: string | null
          supervisor_comment?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
          week_number?: number | null
        }
        Update: {
          activities?: string
          challenges?: string | null
          created_at?: string
          entry_date?: string
          hours?: number | null
          id?: string
          kind?: string
          placement_id?: string | null
          skills_learned?: string | null
          supervisor_comment?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
          week_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "campus_logbook_entries_placement_id_fkey"
            columns: ["placement_id"]
            isOneToOne: false
            referencedRelation: "campus_placements"
            referencedColumns: ["id"]
          },
        ]
      }
      campus_materials: {
        Row: {
          course_code: string | null
          course_id: string | null
          created_at: string
          department: string | null
          description: string | null
          download_count: number
          file_name: string | null
          file_size: number | null
          file_url: string | null
          id: string
          institution_id: string | null
          is_library: boolean
          is_published: boolean
          kind: string
          level: string | null
          price: number
          review_note: string | null
          review_status: string
          reviewed_at: string | null
          submitted_by: string | null
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          course_code?: string | null
          course_id?: string | null
          created_at?: string
          department?: string | null
          description?: string | null
          download_count?: number
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          institution_id?: string | null
          is_library?: boolean
          is_published?: boolean
          kind?: string
          level?: string | null
          price?: number
          review_note?: string | null
          review_status?: string
          reviewed_at?: string | null
          submitted_by?: string | null
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          course_code?: string | null
          course_id?: string | null
          created_at?: string
          department?: string | null
          description?: string | null
          download_count?: number
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          institution_id?: string | null
          is_library?: boolean
          is_published?: boolean
          kind?: string
          level?: string | null
          price?: number
          review_note?: string | null
          review_status?: string
          reviewed_at?: string | null
          submitted_by?: string | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campus_materials_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "campus_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campus_materials_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      campus_nysc_tasks: {
        Row: {
          created_at: string
          due_date: string | null
          id: string
          is_done: boolean
          label: string
          notes: string | null
          phase: string
          position: number
          user_id: string
        }
        Insert: {
          created_at?: string
          due_date?: string | null
          id?: string
          is_done?: boolean
          label: string
          notes?: string | null
          phase?: string
          position?: number
          user_id: string
        }
        Update: {
          created_at?: string
          due_date?: string | null
          id?: string
          is_done?: boolean
          label?: string
          notes?: string | null
          phase?: string
          position?: number
          user_id?: string
        }
        Relationships: []
      }
      campus_opportunities: {
        Row: {
          amount: string | null
          body: string | null
          category: string
          created_at: string
          deadline: string | null
          external_url: string | null
          field: string | null
          id: string
          image_url: string | null
          is_featured: boolean
          is_published: boolean
          level: string | null
          location: string | null
          organisation: string | null
          summary: string | null
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          amount?: string | null
          body?: string | null
          category?: string
          created_at?: string
          deadline?: string | null
          external_url?: string | null
          field?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          is_published?: boolean
          level?: string | null
          location?: string | null
          organisation?: string | null
          summary?: string | null
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          amount?: string | null
          body?: string | null
          category?: string
          created_at?: string
          deadline?: string | null
          external_url?: string | null
          field?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          is_published?: boolean
          level?: string | null
          location?: string | null
          organisation?: string | null
          summary?: string | null
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: []
      }
      campus_placements: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          kind: string
          location: string | null
          notes: string | null
          organisation: string
          role_title: string | null
          school_supervisor: string | null
          start_date: string | null
          status: string
          supervisor_email: string | null
          supervisor_name: string | null
          supervisor_phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          kind?: string
          location?: string | null
          notes?: string | null
          organisation: string
          role_title?: string | null
          school_supervisor?: string | null
          start_date?: string | null
          status?: string
          supervisor_email?: string | null
          supervisor_name?: string | null
          supervisor_phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          kind?: string
          location?: string | null
          notes?: string | null
          organisation?: string
          role_title?: string | null
          school_supervisor?: string | null
          start_date?: string | null
          status?: string
          supervisor_email?: string | null
          supervisor_name?: string | null
          supervisor_phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      campus_project_milestones: {
        Row: {
          created_at: string
          due_date: string | null
          id: string
          is_done: boolean
          position: number
          project_id: string
          supervisor_feedback: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          due_date?: string | null
          id?: string
          is_done?: boolean
          position?: number
          project_id: string
          supervisor_feedback?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          due_date?: string | null
          id?: string
          is_done?: boolean
          position?: number
          project_id?: string
          supervisor_feedback?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campus_project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "campus_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      campus_projects: {
        Row: {
          created_at: string
          deadline: string | null
          department: string | null
          id: string
          notes: string | null
          stage: string
          supervisor: string | null
          title: string
          topic: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deadline?: string | null
          department?: string | null
          id?: string
          notes?: string | null
          stage?: string
          supervisor?: string | null
          title: string
          topic?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deadline?: string | null
          department?: string | null
          id?: string
          notes?: string | null
          stage?: string
          supervisor?: string | null
          title?: string
          topic?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      campus_question_sets: {
        Row: {
          course_id: string | null
          created_at: string
          difficulty: string
          id: string
          question_count: number
          question_type: string
          title: string
          topic: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          difficulty?: string
          id?: string
          question_count?: number
          question_type?: string
          title: string
          topic?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          difficulty?: string
          id?: string
          question_count?: number
          question_type?: string
          title?: string
          topic?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campus_question_sets_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "campus_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      campus_tasks: {
        Row: {
          course_id: string | null
          created_at: string
          due_date: string | null
          id: string
          is_done: boolean
          kind: string
          notes: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          is_done?: boolean
          kind?: string
          notes?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          is_done?: boolean
          kind?: string
          notes?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campus_tasks_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "campus_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      campus_timetable: {
        Row: {
          course_id: string | null
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          lecturer: string | null
          start_time: string
          title: string
          updated_at: string
          user_id: string
          venue: string | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          lecturer?: string | null
          start_time?: string
          title: string
          updated_at?: string
          user_id: string
          venue?: string | null
        }
        Update: {
          course_id?: string | null
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          lecturer?: string | null
          start_time?: string
          title?: string
          updated_at?: string
          user_id?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campus_timetable_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "campus_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_attempts: {
        Row: {
          challenge_id: string
          completed_at: string | null
          correct_answers: number | null
          id: string
          points_earned: number | null
          score: number | null
          time_taken_seconds: number
          total_questions: number
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string | null
          correct_answers?: number | null
          id?: string
          points_earned?: number | null
          score?: number | null
          time_taken_seconds: number
          total_questions: number
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string | null
          correct_answers?: number | null
          id?: string
          points_earned?: number | null
          score?: number | null
          time_taken_seconds?: number
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_attempts_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          challenge_type: string | null
          course_category: Database["public"]["Enums"]["course_category"]
          created_at: string | null
          created_by: string | null
          description: string | null
          difficulty_level: number | null
          duration_minutes: number
          end_date: string
          id: string
          is_active: boolean | null
          points_reward: number | null
          question_count: number
          start_date: string
          subject_ids: Json
          title: string
        }
        Insert: {
          challenge_type?: string | null
          course_category?: Database["public"]["Enums"]["course_category"]
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty_level?: number | null
          duration_minutes?: number
          end_date: string
          id?: string
          is_active?: boolean | null
          points_reward?: number | null
          question_count?: number
          start_date: string
          subject_ids?: Json
          title: string
        }
        Update: {
          challenge_type?: string | null
          course_category?: Database["public"]["Enums"]["course_category"]
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty_level?: number | null
          duration_minutes?: number
          end_date?: string
          id?: string
          is_active?: boolean | null
          points_reward?: number | null
          question_count?: number
          start_date?: string
          subject_ids?: Json
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenges_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_redemptions: {
        Row: {
          coupon_id: string
          id: string
          redeemed_at: string
          user_id: string
        }
        Insert: {
          coupon_id: string
          id?: string
          redeemed_at?: string
          user_id: string
        }
        Update: {
          coupon_id?: string
          id?: string
          redeemed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "promo_coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      deck_questions: {
        Row: {
          correct_index: number
          created_at: string
          explanation: string | null
          id: string
          options: Json
          order_index: number
          question: string
          section_id: string
        }
        Insert: {
          correct_index?: number
          created_at?: string
          explanation?: string | null
          id?: string
          options?: Json
          order_index?: number
          question: string
          section_id: string
        }
        Update: {
          correct_index?: number
          created_at?: string
          explanation?: string | null
          id?: string
          options?: Json
          order_index?: number
          question?: string
          section_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deck_questions_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "deck_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      deck_section_attempts: {
        Row: {
          answers: Json
          created_at: string
          deck_id: string
          id: string
          passed: boolean
          percentage: number
          score: number
          section_id: string
          total: number
          user_id: string
        }
        Insert: {
          answers?: Json
          created_at?: string
          deck_id: string
          id?: string
          passed?: boolean
          percentage?: number
          score?: number
          section_id: string
          total?: number
          user_id?: string
        }
        Update: {
          answers?: Json
          created_at?: string
          deck_id?: string
          id?: string
          passed?: boolean
          percentage?: number
          score?: number
          section_id?: string
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deck_section_attempts_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "study_decks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deck_section_attempts_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "deck_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      deck_sections: {
        Row: {
          content: string
          created_at: string
          deck_id: string
          id: string
          order_index: number
          summary: string | null
          title: string
        }
        Insert: {
          content?: string
          created_at?: string
          deck_id: string
          id?: string
          order_index: number
          summary?: string | null
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          deck_id?: string
          id?: string
          order_index?: number
          summary?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "deck_sections_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "study_decks"
            referencedColumns: ["id"]
          },
        ]
      }
      ebook_access: {
        Row: {
          code_used: string | null
          created_at: string
          device_fingerprint: string | null
          device_locked_at: string | null
          ebook_id: string
          email: string | null
          expires_at: string | null
          full_name: string | null
          granted_by: string | null
          id: string
          last_seen_at: string | null
          source: string
          user_id: string | null
        }
        Insert: {
          code_used?: string | null
          created_at?: string
          device_fingerprint?: string | null
          device_locked_at?: string | null
          ebook_id: string
          email?: string | null
          expires_at?: string | null
          full_name?: string | null
          granted_by?: string | null
          id?: string
          last_seen_at?: string | null
          source?: string
          user_id?: string | null
        }
        Update: {
          code_used?: string | null
          created_at?: string
          device_fingerprint?: string | null
          device_locked_at?: string | null
          ebook_id?: string
          email?: string | null
          expires_at?: string | null
          full_name?: string | null
          granted_by?: string | null
          id?: string
          last_seen_at?: string | null
          source?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ebook_access_ebook_id_fkey"
            columns: ["ebook_id"]
            isOneToOne: false
            referencedRelation: "ebooks"
            referencedColumns: ["id"]
          },
        ]
      }
      ebook_access_codes: {
        Row: {
          code: string
          created_at: string
          ebook_id: string
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          ebook_id: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          ebook_id?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number
          used_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "ebook_access_codes_ebook_id_fkey"
            columns: ["ebook_id"]
            isOneToOne: false
            referencedRelation: "ebooks"
            referencedColumns: ["id"]
          },
        ]
      }
      ebook_chapters: {
        Row: {
          chapter_number: number
          content: string
          created_at: string
          ebook_id: string
          id: string
          is_preview: boolean
          title: string
          updated_at: string
        }
        Insert: {
          chapter_number?: number
          content?: string
          created_at?: string
          ebook_id: string
          id?: string
          is_preview?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          chapter_number?: number
          content?: string
          created_at?: string
          ebook_id?: string
          id?: string
          is_preview?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ebook_chapters_ebook_id_fkey"
            columns: ["ebook_id"]
            isOneToOne: false
            referencedRelation: "ebooks"
            referencedColumns: ["id"]
          },
        ]
      }
      ebooks: {
        Row: {
          author: string
          brand: string
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          pdf_path: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author?: string
          brand?: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          pdf_path?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author?: string
          brand?: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          pdf_path?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_delivery_log: {
        Row: {
          created_at: string
          email_type: string
          error_message: string | null
          id: string
          provider_message_id: string | null
          recipient_email: string
          sent_at: string | null
          status: string
          subject: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email_type: string
          error_message?: string | null
          id?: string
          provider_message_id?: string | null
          recipient_email: string
          sent_at?: string | null
          status: string
          subject?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email_type?: string
          error_message?: string | null
          id?: string
          provider_message_id?: string | null
          recipient_email?: string
          sent_at?: string | null
          status?: string
          subject?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_delivery_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      email_preferences: {
        Row: {
          created_at: string
          id: string
          marketing_emails: boolean
          product_updates: boolean
          subscription_reminders: boolean
          unsubscribe_token: string
          updated_at: string
          user_id: string
          welcome_emails: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          marketing_emails?: boolean
          product_updates?: boolean
          subscription_reminders?: boolean
          unsubscribe_token?: string
          updated_at?: string
          user_id: string
          welcome_emails?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          marketing_emails?: boolean
          product_updates?: boolean
          subscription_reminders?: boolean
          unsubscribe_token?: string
          updated_at?: string
          user_id?: string
          welcome_emails?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "email_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_questions: {
        Row: {
          created_at: string | null
          display_order: number | null
          exam_id: string
          id: string
          question_id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          exam_id: string
          id?: string
          question_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          exam_id?: string
          id?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_questions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_subjects: {
        Row: {
          display_order: number | null
          exam_id: string | null
          id: string
          is_mandatory: boolean | null
          question_count: number
          subject_id: string | null
          subject_name: string
          time_allocation_minutes: number | null
        }
        Insert: {
          display_order?: number | null
          exam_id?: string | null
          id?: string
          is_mandatory?: boolean | null
          question_count: number
          subject_id?: string | null
          subject_name: string
          time_allocation_minutes?: number | null
        }
        Update: {
          display_order?: number | null
          exam_id?: string | null
          id?: string
          is_mandatory?: boolean | null
          question_count?: number
          subject_id?: string | null
          subject_name?: string
          time_allocation_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_subjects_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          duration_minutes: number
          id: string
          instructions: string | null
          is_published: boolean | null
          passing_score: number | null
          question_selection_mode: string | null
          questions_per_subject: number | null
          requires_subscription: boolean | null
          school_id: string | null
          subscription_level: string | null
          target_departments: Json | null
          title: string
          total_questions: number | null
          type: Database["public"]["Enums"]["exam_type"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_minutes: number
          id?: string
          instructions?: string | null
          is_published?: boolean | null
          passing_score?: number | null
          question_selection_mode?: string | null
          questions_per_subject?: number | null
          requires_subscription?: boolean | null
          school_id?: string | null
          subscription_level?: string | null
          target_departments?: Json | null
          title: string
          total_questions?: number | null
          type: Database["public"]["Enums"]["exam_type"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_minutes?: number
          id?: string
          instructions?: string | null
          is_published?: boolean | null
          passing_score?: number | null
          question_selection_mode?: string | null
          questions_per_subject?: number | null
          requires_subscription?: boolean | null
          school_id?: string | null
          subscription_level?: string | null
          target_departments?: Json | null
          title?: string
          total_questions?: number | null
          type?: Database["public"]["Enums"]["exam_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exams_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      external_question_mappings: {
        Row: {
          created_at: string | null
          edura_subject_id: string | null
          exam_body: string
          external_subject_code: string | null
          external_subject_name: string
          id: string
          is_active: boolean | null
          provider: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          edura_subject_id?: string | null
          exam_body: string
          external_subject_code?: string | null
          external_subject_name: string
          id?: string
          is_active?: boolean | null
          provider: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          edura_subject_id?: string | null
          exam_body?: string
          external_subject_code?: string | null
          external_subject_name?: string
          id?: string
          is_active?: boolean | null
          provider?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "external_question_mappings_edura_subject_id_fkey"
            columns: ["edura_subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      external_sync_logs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          error_count: number | null
          error_message: string | null
          exam_body: string
          id: string
          imported_count: number | null
          provider: string
          requested_count: number | null
          skipped_count: number | null
          started_at: string | null
          status: string
          subject_id: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          error_count?: number | null
          error_message?: string | null
          exam_body: string
          id?: string
          imported_count?: number | null
          provider: string
          requested_count?: number | null
          skipped_count?: number | null
          started_at?: string | null
          status?: string
          subject_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          error_count?: number | null
          error_message?: string | null
          exam_body?: string
          id?: string
          imported_count?: number | null
          provider?: string
          requested_count?: number | null
          skipped_count?: number | null
          started_at?: string | null
          status?: string
          subject_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "external_sync_logs_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_posts: {
        Row: {
          content: string
          created_at: string | null
          exam_type: Database["public"]["Enums"]["exam_type"] | null
          id: string
          images: Json | null
          is_featured: boolean | null
          is_pinned: boolean | null
          is_solved: boolean | null
          reply_count: number | null
          solved_at: string | null
          subject_id: string | null
          title: string
          updated_at: string | null
          upvotes: number | null
          user_id: string
          view_count: number | null
        }
        Insert: {
          content: string
          created_at?: string | null
          exam_type?: Database["public"]["Enums"]["exam_type"] | null
          id?: string
          images?: Json | null
          is_featured?: boolean | null
          is_pinned?: boolean | null
          is_solved?: boolean | null
          reply_count?: number | null
          solved_at?: string | null
          subject_id?: string | null
          title: string
          updated_at?: string | null
          upvotes?: number | null
          user_id: string
          view_count?: number | null
        }
        Update: {
          content?: string
          created_at?: string | null
          exam_type?: Database["public"]["Enums"]["exam_type"] | null
          id?: string
          images?: Json | null
          is_featured?: boolean | null
          is_pinned?: boolean | null
          is_solved?: boolean | null
          reply_count?: number | null
          solved_at?: string | null
          subject_id?: string | null
          title?: string
          updated_at?: string | null
          upvotes?: number | null
          user_id?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_posts_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_replies: {
        Row: {
          content: string
          created_at: string | null
          id: string
          images: Json | null
          is_answer: boolean | null
          post_id: string
          updated_at: string | null
          upvotes: number | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          images?: Json | null
          is_answer?: boolean | null
          post_id: string
          updated_at?: string | null
          upvotes?: number | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          images?: Json | null
          is_answer?: boolean | null
          post_id?: string
          updated_at?: string | null
          upvotes?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_replies_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_replies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_votes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string | null
          reply_id: string | null
          user_id: string
          vote_type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          reply_id?: string | null
          user_id: string
          vote_type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          reply_id?: string | null
          user_id?: string
          vote_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_votes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_votes_reply_id_fkey"
            columns: ["reply_id"]
            isOneToOne: false
            referencedRelation: "forum_replies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      institution_logos: {
        Row: {
          aliases: string[]
          created_at: string
          domain: string | null
          id: string
          institution_type: string | null
          is_active: boolean
          logo_url: string | null
          name: string
          short_name: string | null
          updated_at: string
        }
        Insert: {
          aliases?: string[]
          created_at?: string
          domain?: string | null
          id?: string
          institution_type?: string | null
          is_active?: boolean
          logo_url?: string | null
          name: string
          short_name?: string | null
          updated_at?: string
        }
        Update: {
          aliases?: string[]
          created_at?: string
          domain?: string | null
          id?: string
          institution_type?: string | null
          is_active?: boolean
          logo_url?: string | null
          name?: string
          short_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      institutions: {
        Row: {
          created_at: string
          form_fee: number
          id: string
          is_active: boolean
          name: string
          notes: string | null
          service_fee_override: number | null
          short_code: string | null
          state: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          form_fee?: number
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          service_fee_override?: number | null
          short_code?: string | null
          state?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          form_fee?: number
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          service_fee_override?: number | null
          short_code?: string | null
          state?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      lesson_completions: {
        Row: {
          completed_at: string
          created_at: string | null
          id: string
          lesson_id: string
          quiz_percentage: number | null
          quiz_score: number | null
          time_spent_minutes: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string | null
          id?: string
          lesson_id: string
          quiz_percentage?: number | null
          quiz_score?: number | null
          time_spent_minutes?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string | null
          id?: string
          lesson_id?: string
          quiz_percentage?: number | null
          quiz_score?: number | null
          time_spent_minutes?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_completions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "study_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_questions: {
        Row: {
          display_order: number | null
          id: string
          lesson_id: string
          question_id: string
        }
        Insert: {
          display_order?: number | null
          id?: string
          lesson_id: string
          question_id: string
        }
        Update: {
          display_order?: number | null
          id?: string
          lesson_id?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "study_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          created_at: string
          email: string
          id: string
          ip_address: unknown
          success: boolean
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          ip_address?: unknown
          success?: boolean
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          ip_address?: unknown
          success?: boolean
        }
        Relationships: []
      }
      mock_batches: {
        Row: {
          batch_type: string | null
          created_at: string | null
          exam_date: string | null
          exam_venue: string | null
          id: string
          is_active: boolean | null
          results_release_date: string | null
          results_released: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          batch_type?: string | null
          created_at?: string | null
          exam_date?: string | null
          exam_venue?: string | null
          id?: string
          is_active?: boolean | null
          results_release_date?: string | null
          results_released?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          batch_type?: string | null
          created_at?: string | null
          exam_date?: string | null
          exam_venue?: string | null
          id?: string
          is_active?: boolean | null
          results_release_date?: string | null
          results_released?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      mock_registrations: {
        Row: {
          attempt_id: string | null
          batch_id: string | null
          created_at: string | null
          email: string | null
          exam_started_at: string | null
          exam_status: string | null
          exam_submitted_at: string | null
          full_name: string
          id: string
          mode: string
          payment_receipt_url: string | null
          payment_status: string | null
          phone: string
          registration_number: string
          school_id: string | null
          school_student_id: string | null
          subjects: Json
          updated_at: string | null
          user_id: string | null
          verified_at: string | null
          verified_present: boolean | null
        }
        Insert: {
          attempt_id?: string | null
          batch_id?: string | null
          created_at?: string | null
          email?: string | null
          exam_started_at?: string | null
          exam_status?: string | null
          exam_submitted_at?: string | null
          full_name: string
          id?: string
          mode: string
          payment_receipt_url?: string | null
          payment_status?: string | null
          phone: string
          registration_number: string
          school_id?: string | null
          school_student_id?: string | null
          subjects?: Json
          updated_at?: string | null
          user_id?: string | null
          verified_at?: string | null
          verified_present?: boolean | null
        }
        Update: {
          attempt_id?: string | null
          batch_id?: string | null
          created_at?: string | null
          email?: string | null
          exam_started_at?: string | null
          exam_status?: string | null
          exam_submitted_at?: string | null
          full_name?: string
          id?: string
          mode?: string
          payment_receipt_url?: string | null
          payment_status?: string | null
          phone?: string
          registration_number?: string
          school_id?: string | null
          school_student_id?: string | null
          subjects?: Json
          updated_at?: string | null
          user_id?: string | null
          verified_at?: string | null
          verified_present?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "mock_registrations_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mock_registrations_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "mock_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mock_registrations_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mock_registrations_school_student_id_fkey"
            columns: ["school_student_id"]
            isOneToOne: false
            referencedRelation: "school_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mock_registrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mock_results: {
        Row: {
          attempt_id: string | null
          batch_id: string | null
          created_at: string | null
          id: string
          is_released: boolean | null
          max_score: number
          registration_id: string
          registration_number: string
          strengths: Json | null
          subject_scores: Json
          total_score: number
          weaknesses: Json | null
        }
        Insert: {
          attempt_id?: string | null
          batch_id?: string | null
          created_at?: string | null
          id?: string
          is_released?: boolean | null
          max_score?: number
          registration_id: string
          registration_number: string
          strengths?: Json | null
          subject_scores?: Json
          total_score?: number
          weaknesses?: Json | null
        }
        Update: {
          attempt_id?: string | null
          batch_id?: string | null
          created_at?: string | null
          id?: string
          is_released?: boolean | null
          max_score?: number
          registration_id?: string
          registration_number?: string
          strengths?: Json | null
          subject_scores?: Json
          total_score?: number
          weaknesses?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "mock_results_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mock_results_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "mock_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mock_results_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: true
            referencedRelation: "mock_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      mock_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value?: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      mock_verification_logs: {
        Row: {
          attempt_id: string | null
          created_at: string | null
          id: string
          method: string | null
          payload: Json | null
          reason: string | null
          registration_id: string | null
          registration_number: string | null
          result: string | null
        }
        Insert: {
          attempt_id?: string | null
          created_at?: string | null
          id?: string
          method?: string | null
          payload?: Json | null
          reason?: string | null
          registration_id?: string | null
          registration_number?: string | null
          result?: string | null
        }
        Update: {
          attempt_id?: string | null
          created_at?: string | null
          id?: string
          method?: string | null
          payload?: Json | null
          reason?: string | null
          registration_id?: string | null
          registration_number?: string | null
          result?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mock_verification_logs_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "mock_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_log: {
        Row: {
          channel: string
          created_at: string
          dedupe_key: string
          id: string
          rule_key: string
          sent_at: string
          user_id: string
        }
        Insert: {
          channel?: string
          created_at?: string
          dedupe_key: string
          id?: string
          rule_key: string
          sent_at?: string
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          dedupe_key?: string
          id?: string
          rule_key?: string
          sent_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_rules: {
        Row: {
          category: string
          created_at: string
          description: string | null
          enabled: boolean
          id: string
          label: string
          last_run_at: string | null
          last_sent_count: number
          priority: number
          rule_key: string
          run_window: string
          total_sent_count: number
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          label: string
          last_run_at?: string | null
          last_sent_count?: number
          priority?: number
          rule_key: string
          run_window?: string
          total_sent_count?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          label?: string
          last_run_at?: string | null
          last_sent_count?: number
          priority?: number
          rule_key?: string
          run_window?: string
          total_sent_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          title: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          title: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          title?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      offline_downloads: {
        Row: {
          created_at: string | null
          download_date: string | null
          exam_type: Database["public"]["Enums"]["exam_type"]
          expires_at: string | null
          id: string
          is_synced: boolean | null
          last_synced_at: string | null
          questions_data: Json
          subject_ids: Json
          user_id: string
        }
        Insert: {
          created_at?: string | null
          download_date?: string | null
          exam_type: Database["public"]["Enums"]["exam_type"]
          expires_at?: string | null
          id?: string
          is_synced?: boolean | null
          last_synced_at?: string | null
          questions_data: Json
          subject_ids?: Json
          user_id: string
        }
        Update: {
          created_at?: string | null
          download_date?: string | null
          exam_type?: Database["public"]["Enums"]["exam_type"]
          expires_at?: string | null
          id?: string
          is_synced?: boolean | null
          last_synced_at?: string | null
          questions_data?: Json
          subject_ids?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offline_downloads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          icon_url: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          name: string
          sort_order: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name: string
          sort_order?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      promo_coupons: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          expiry_date: string
          id: string
          is_active: boolean
          usage_limit: number
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expiry_date: string
          id?: string
          is_active?: boolean
          usage_limit?: number
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expiry_date?: string
          id?: string
          is_active?: boolean
          usage_limit?: number
          used_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "promo_coupons_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      push_devices: {
        Row: {
          created_at: string
          device_id: string
          enabled: boolean
          id: string
          last_seen_at: string
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_id: string
          enabled?: boolean
          id?: string
          last_seen_at?: string
          platform?: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_id?: string
          enabled?: boolean
          id?: string
          last_seen_at?: string
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          correct_answer: string
          created_at: string | null
          created_by: string | null
          difficulty_level: number | null
          exam_body: string | null
          exam_year: number | null
          explanation: string | null
          external_id: string | null
          external_source: string | null
          id: string
          is_active: boolean | null
          media_urls: Json | null
          option_media: Json | null
          options: Json | null
          points: number | null
          question_text: string
          subject_id: string | null
          tags: Json | null
          time_limit_seconds: number | null
          type: Database["public"]["Enums"]["question_type"]
          updated_at: string | null
        }
        Insert: {
          correct_answer: string
          created_at?: string | null
          created_by?: string | null
          difficulty_level?: number | null
          exam_body?: string | null
          exam_year?: number | null
          explanation?: string | null
          external_id?: string | null
          external_source?: string | null
          id?: string
          is_active?: boolean | null
          media_urls?: Json | null
          option_media?: Json | null
          options?: Json | null
          points?: number | null
          question_text: string
          subject_id?: string | null
          tags?: Json | null
          time_limit_seconds?: number | null
          type: Database["public"]["Enums"]["question_type"]
          updated_at?: string | null
        }
        Update: {
          correct_answer?: string
          created_at?: string | null
          created_by?: string | null
          difficulty_level?: number | null
          exam_body?: string | null
          exam_year?: number | null
          explanation?: string | null
          external_id?: string | null
          external_source?: string | null
          id?: string
          is_active?: boolean | null
          media_urls?: Json | null
          option_media?: Json | null
          options?: Json | null
          points?: number | null
          question_text?: string
          subject_id?: string | null
          tags?: Json | null
          time_limit_seconds?: number | null
          type?: Database["public"]["Enums"]["question_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          created_at: string | null
          details: Json | null
          endpoint: string
          id: string
          request_count: number | null
          user_id: string | null
          window_start: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          endpoint: string
          id?: string
          request_count?: number | null
          user_id?: string | null
          window_start?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          endpoint?: string
          id?: string
          request_count?: number | null
          user_id?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          user_id: string
          uses_count: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          user_id: string
          uses_count?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          user_id?: string
          uses_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_rewards: {
        Row: {
          claimed: boolean | null
          claimed_at: string | null
          created_at: string | null
          description: string | null
          id: string
          referral_id: string | null
          reward_type: string
          reward_value: number
          user_id: string
        }
        Insert: {
          claimed?: boolean | null
          claimed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          referral_id?: string | null
          reward_type: string
          reward_value: number
          user_id: string
        }
        Update: {
          claimed?: boolean | null
          claimed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          referral_id?: string | null
          reward_type?: string
          reward_value?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_rewards_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_rewards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          converted_at: string | null
          created_at: string | null
          id: string
          referral_code: string
          referred_user_id: string
          referrer_id: string
          reward_days: number | null
          reward_points: number | null
          status: string | null
        }
        Insert: {
          converted_at?: string | null
          created_at?: string | null
          id?: string
          referral_code: string
          referred_user_id: string
          referrer_id: string
          reward_days?: number | null
          reward_points?: number | null
          status?: string | null
        }
        Update: {
          converted_at?: string | null
          created_at?: string | null
          id?: string
          referral_code?: string
          referred_user_id?: string
          referrer_id?: string
          reward_days?: number | null
          reward_points?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          access_level: string | null
          created_at: string | null
          description: string | null
          download_count: number | null
          file_size_bytes: number | null
          file_type: string | null
          file_url: string
          id: string
          is_active: boolean | null
          subject_id: string | null
          tags: Json | null
          title: string
          uploaded_by: string | null
          view_count: number | null
        }
        Insert: {
          access_level?: string | null
          created_at?: string | null
          description?: string | null
          download_count?: number | null
          file_size_bytes?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          is_active?: boolean | null
          subject_id?: string | null
          tags?: Json | null
          title: string
          uploaded_by?: string | null
          view_count?: number | null
        }
        Update: {
          access_level?: string | null
          created_at?: string | null
          description?: string | null
          download_count?: number | null
          file_size_bytes?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          is_active?: boolean | null
          subject_id?: string | null
          tags?: Json | null
          title?: string
          uploaded_by?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "resources_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      results: {
        Row: {
          attempt_id: string | null
          auto_graded: boolean | null
          correct_answers: number
          created_at: string | null
          graded_at: string | null
          graded_by: string | null
          id: string
          percentage: number | null
          percentile_rank: number | null
          raw_score: number
          scaled_score: number | null
          subject_breakdown: Json | null
          time_taken_minutes: number | null
          total_questions: number
          unanswered: number
          wrong_answers: number
        }
        Insert: {
          attempt_id?: string | null
          auto_graded?: boolean | null
          correct_answers?: number
          created_at?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          percentage?: number | null
          percentile_rank?: number | null
          raw_score?: number
          scaled_score?: number | null
          subject_breakdown?: Json | null
          time_taken_minutes?: number | null
          total_questions: number
          unanswered?: number
          wrong_answers?: number
        }
        Update: {
          attempt_id?: string | null
          auto_graded?: boolean | null
          correct_answers?: number
          created_at?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          percentage?: number | null
          percentile_rank?: number | null
          raw_score?: number
          scaled_score?: number | null
          subject_breakdown?: Json | null
          time_taken_minutes?: number | null
          total_questions?: number
          unanswered?: number
          wrong_answers?: number
        }
        Relationships: [
          {
            foreignKeyName: "results_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: true
            referencedRelation: "attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "results_graded_by_fkey"
            columns: ["graded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      role: {
        Row: {
          created_at: string | null
          id: string
          name: string
          permissions: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          permissions?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          permissions?: Json | null
        }
        Relationships: []
      }
      school_exam_assignments: {
        Row: {
          assigned_to_all: boolean | null
          created_at: string | null
          created_by: string | null
          end_date: string | null
          exam_id: string
          id: string
          is_active: boolean | null
          school_id: string
          start_date: string | null
          student_id: string | null
        }
        Insert: {
          assigned_to_all?: boolean | null
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          exam_id: string
          id?: string
          is_active?: boolean | null
          school_id: string
          start_date?: string | null
          student_id?: string | null
        }
        Update: {
          assigned_to_all?: boolean | null
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          exam_id?: string
          id?: string
          is_active?: boolean | null
          school_id?: string
          start_date?: string | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "school_exam_assignments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_exam_assignments_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_exam_assignments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_exam_assignments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      school_staff: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          invite_status: string
          invite_token: string | null
          invited_at: string | null
          is_active: boolean | null
          permissions: Json | null
          role: string | null
          school_id: string
          user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          invite_status?: string
          invite_token?: string | null
          invited_at?: string | null
          is_active?: boolean | null
          permissions?: Json | null
          role?: string | null
          school_id: string
          user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          invite_status?: string
          invite_token?: string | null
          invited_at?: string | null
          is_active?: boolean | null
          permissions?: Json | null
          role?: string | null
          school_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "school_staff_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_staff_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      school_students: {
        Row: {
          class_level: string | null
          created_at: string | null
          department: string | null
          enrollment_date: string | null
          full_name: string | null
          id: string
          is_active: boolean | null
          school_id: string
          student_id: string | null
          student_password_hash: string | null
          student_username: string | null
          user_id: string
        }
        Insert: {
          class_level?: string | null
          created_at?: string | null
          department?: string | null
          enrollment_date?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          school_id: string
          student_id?: string | null
          student_password_hash?: string | null
          student_username?: string | null
          user_id: string
        }
        Update: {
          class_level?: string | null
          created_at?: string | null
          department?: string | null
          enrollment_date?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          school_id?: string
          student_id?: string | null
          student_password_hash?: string | null
          student_username?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_students_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      school_subscriptions: {
        Row: {
          admin_user_id: string | null
          auto_renew: boolean | null
          created_at: string | null
          end_date: string | null
          features: Json | null
          id: string
          payment_reference: string | null
          plan_id: string | null
          price_per_student: number | null
          school_id: string
          start_date: string | null
          status: Database["public"]["Enums"]["subscription_status"] | null
          student_seats: number | null
          total_amount: number | null
          updated_at: string | null
          used_seats: number | null
        }
        Insert: {
          admin_user_id?: string | null
          auto_renew?: boolean | null
          created_at?: string | null
          end_date?: string | null
          features?: Json | null
          id?: string
          payment_reference?: string | null
          plan_id?: string | null
          price_per_student?: number | null
          school_id: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          student_seats?: number | null
          total_amount?: number | null
          updated_at?: string | null
          used_seats?: number | null
        }
        Update: {
          admin_user_id?: string | null
          auto_renew?: boolean | null
          created_at?: string | null
          end_date?: string | null
          features?: Json | null
          id?: string
          payment_reference?: string | null
          plan_id?: string | null
          price_per_student?: number | null
          school_id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          student_seats?: number | null
          total_amount?: number | null
          updated_at?: string | null
          used_seats?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "school_subscriptions_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_subscriptions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          address: string | null
          admin_user_id: string | null
          city: string | null
          country: string | null
          created_at: string | null
          description: string | null
          email: string
          email_verified: boolean | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          max_students: number | null
          name: string
          phone: string | null
          registration_number: string | null
          school_code: string
          slug: string
          state: string | null
          students_added: number | null
          type: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          admin_user_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          email: string
          email_verified?: boolean | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          max_students?: number | null
          name: string
          phone?: string | null
          registration_number?: string | null
          school_code: string
          slug: string
          state?: string | null
          students_added?: number | null
          type?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          admin_user_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          email?: string
          email_verified?: boolean | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          max_students?: number | null
          name?: string
          phone?: string | null
          registration_number?: string | null
          school_code?: string
          slug?: string
          state?: string | null
          students_added?: number | null
          type?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schools_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      scratch_card_orders: {
        Row: {
          amount: number
          created_at: string
          error_message: string | null
          id: string
          payment_method: string
          payment_reference: string | null
          pins: Json
          provider: string
          quantity: number
          service_id: string | null
          service_name: string
          service_slug: string
          status: string
          unit_price: number
          updated_at: string
          user_id: string
          vendor_reference: string | null
          vendor_response: Json | null
        }
        Insert: {
          amount?: number
          created_at?: string
          error_message?: string | null
          id?: string
          payment_method?: string
          payment_reference?: string | null
          pins?: Json
          provider: string
          quantity?: number
          service_id?: string | null
          service_name: string
          service_slug: string
          status?: string
          unit_price?: number
          updated_at?: string
          user_id: string
          vendor_reference?: string | null
          vendor_response?: Json | null
        }
        Update: {
          amount?: number
          created_at?: string
          error_message?: string | null
          id?: string
          payment_method?: string
          payment_reference?: string | null
          pins?: Json
          provider?: string
          quantity?: number
          service_id?: string | null
          service_name?: string
          service_slug?: string
          status?: string
          unit_price?: number
          updated_at?: string
          user_id?: string
          vendor_reference?: string | null
          vendor_response?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "scratch_card_orders_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      service_catalog: {
        Row: {
          created_at: string
          description: string | null
          fields: Json
          icon: string | null
          id: string
          is_active: boolean
          is_automated: boolean
          name: string
          price: number
          pricing_mode: string
          product_type: string
          provider: string
          slug: string
          sort_order: number
          turnaround: string | null
          updated_at: string
          vendor_code: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          fields?: Json
          icon?: string | null
          id?: string
          is_active?: boolean
          is_automated?: boolean
          name: string
          price?: number
          pricing_mode?: string
          product_type?: string
          provider: string
          slug: string
          sort_order?: number
          turnaround?: string | null
          updated_at?: string
          vendor_code?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          fields?: Json
          icon?: string | null
          id?: string
          is_active?: boolean
          is_automated?: boolean
          name?: string
          price?: number
          pricing_mode?: string
          product_type?: string
          provider?: string
          slug?: string
          sort_order?: number
          turnaround?: string | null
          updated_at?: string
          vendor_code?: string | null
        }
        Relationships: []
      }
      service_requests: {
        Row: {
          admin_note: string | null
          amount: number
          created_at: string
          form_data: Json
          form_fee: number | null
          id: string
          institution_id: string | null
          institution_name: string | null
          paid_from: string | null
          payment_reference: string | null
          provider: string
          quote_status: string | null
          quoted_amount: number | null
          result: Json | null
          result_files: Json
          service_fee: number | null
          service_id: string | null
          service_name: string
          service_slug: string
          status: string
          updated_at: string
          user_files: Json
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          amount?: number
          created_at?: string
          form_data?: Json
          form_fee?: number | null
          id?: string
          institution_id?: string | null
          institution_name?: string | null
          paid_from?: string | null
          payment_reference?: string | null
          provider: string
          quote_status?: string | null
          quoted_amount?: number | null
          result?: Json | null
          result_files?: Json
          service_fee?: number | null
          service_id?: string | null
          service_name: string
          service_slug: string
          status?: string
          updated_at?: string
          user_files?: Json
          user_id: string
        }
        Update: {
          admin_note?: string | null
          amount?: number
          created_at?: string
          form_data?: Json
          form_fee?: number | null
          id?: string
          institution_id?: string | null
          institution_name?: string | null
          paid_from?: string | null
          payment_reference?: string | null
          provider?: string
          quote_status?: string | null
          quoted_amount?: number | null
          result?: Json | null
          result_files?: Json
          service_fee?: number | null
          service_id?: string | null
          service_name?: string
          service_slug?: string
          status?: string
          updated_at?: string
          user_files?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      study_decks: {
        Row: {
          created_at: string
          description: string | null
          error_message: string | null
          id: string
          page_count: number
          pass_mark: number
          section_count: number
          source_path: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          error_message?: string | null
          id?: string
          page_count?: number
          pass_mark?: number
          section_count?: number
          source_path?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          error_message?: string | null
          id?: string
          page_count?: number
          pass_mark?: number
          section_count?: number
          source_path?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      study_goals: {
        Row: {
          completed_at: string | null
          created_at: string | null
          current_value: number | null
          description: string | null
          goal_type: string
          id: string
          is_completed: boolean | null
          target_date: string
          target_value: number
          title: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          goal_type: string
          id?: string
          is_completed?: boolean | null
          target_date: string
          target_value: number
          title: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          goal_type?: string
          id?: string
          is_completed?: boolean | null
          target_date?: string
          target_value?: number
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      study_lessons: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          display_order: number | null
          estimated_minutes: number | null
          id: string
          is_active: boolean | null
          media_urls: Json | null
          summary: string | null
          title: string
          topic_id: string
          updated_at: string | null
          video_duration_minutes: number | null
          video_platform: string | null
          video_url: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          estimated_minutes?: number | null
          id?: string
          is_active?: boolean | null
          media_urls?: Json | null
          summary?: string | null
          title: string
          topic_id: string
          updated_at?: string | null
          video_duration_minutes?: number | null
          video_platform?: string | null
          video_url?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          estimated_minutes?: number | null
          id?: string
          is_active?: boolean | null
          media_urls?: Json | null
          summary?: string | null
          title?: string
          topic_id?: string
          updated_at?: string | null
          video_duration_minutes?: number | null
          video_platform?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "study_lessons_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_lessons_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "study_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      study_resources: {
        Row: {
          created_at: string | null
          display_order: number | null
          duration_seconds: number | null
          file_size_bytes: number | null
          id: string
          lesson_id: string
          resource_type: string
          resource_url: string
          title: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          duration_seconds?: number | null
          file_size_bytes?: number | null
          id?: string
          lesson_id: string
          resource_type: string
          resource_url: string
          title: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          duration_seconds?: number | null
          file_size_bytes?: number | null
          id?: string
          lesson_id?: string
          resource_type?: string
          resource_url?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_resources_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "study_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      study_sessions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          description: string | null
          end_time: string
          id: string
          notes: string | null
          reminder_sent: boolean | null
          session_date: string
          start_time: string
          status: string | null
          subject_id: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          end_time: string
          id?: string
          notes?: string | null
          reminder_sent?: boolean | null
          session_date: string
          start_time: string
          status?: string | null
          subject_id?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string
          id?: string
          notes?: string | null
          reminder_sent?: boolean | null
          session_date?: string
          start_time?: string
          status?: string | null
          subject_id?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      study_topics: {
        Row: {
          created_at: string | null
          description: string | null
          difficulty_level: number | null
          display_order: number | null
          exam_type: Database["public"]["Enums"]["exam_type"]
          id: string
          is_active: boolean | null
          subject_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          difficulty_level?: number | null
          display_order?: number | null
          exam_type: Database["public"]["Enums"]["exam_type"]
          id?: string
          is_active?: boolean | null
          subject_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          difficulty_level?: number | null
          display_order?: number | null
          exam_type?: Database["public"]["Enums"]["exam_type"]
          id?: string
          is_active?: boolean | null
          subject_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "study_topics_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          code: string | null
          course_category: Database["public"]["Enums"]["course_category"] | null
          created_at: string | null
          default_question_count: number | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          code?: string | null
          course_category?:
            | Database["public"]["Enums"]["course_category"]
            | null
          created_at?: string | null
          default_question_count?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          code?: string | null
          course_category?:
            | Database["public"]["Enums"]["course_category"]
            | null
          created_at?: string | null
          default_question_count?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string | null
          currency: string | null
          description: string | null
          duration_days: number
          features: Json | null
          id: string
          is_active: boolean | null
          max_attempts: number | null
          name: string
          price: number
          resource_access_level: string | null
          scope: string
          tier: string
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          duration_days: number
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_attempts?: number | null
          name: string
          price?: number
          resource_access_level?: string | null
          scope?: string
          tier?: string
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          duration_days?: number
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_attempts?: number | null
          name?: string
          price?: number
          resource_access_level?: string | null
          scope?: string
          tier?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          auto_renew: boolean | null
          created_at: string | null
          end_date: string | null
          id: string
          payment_reference: string | null
          plan_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["subscription_status"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          auto_renew?: boolean | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          payment_reference?: string | null
          plan_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          auto_renew?: boolean | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          payment_reference?: string | null
          plan_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      syllabus_coverage: {
        Row: {
          attempted_questions: number
          correct_questions: number
          coverage_percentage: number | null
          created_at: string | null
          id: string
          last_practiced_at: string | null
          mastery_percentage: number | null
          subject_id: string
          topic_name: string
          total_questions: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attempted_questions?: number
          correct_questions?: number
          coverage_percentage?: number | null
          created_at?: string | null
          id?: string
          last_practiced_at?: string | null
          mastery_percentage?: number | null
          subject_id: string
          topic_name: string
          total_questions?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attempted_questions?: number
          correct_questions?: number
          coverage_percentage?: number | null
          created_at?: string | null
          id?: string
          last_practiced_at?: string | null
          mastery_percentage?: number | null
          subject_id?: string
          topic_name?: string
          total_questions?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "syllabus_coverage_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "syllabus_coverage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_public: boolean | null
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      team_applications: {
        Row: {
          availability: string[]
          created_at: string
          email: string | null
          full_name: string
          id: string
          optional_notes: string | null
          preferred_role: string
          skills_experience: string
          status: string
          terms_agreed: boolean
          updated_at: string
          whatsapp_number: string
          why_join: string
        }
        Insert: {
          availability: string[]
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          optional_notes?: string | null
          preferred_role: string
          skills_experience: string
          status?: string
          terms_agreed?: boolean
          updated_at?: string
          whatsapp_number: string
          why_join: string
        }
        Update: {
          availability?: string[]
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          optional_notes?: string | null
          preferred_role?: string
          skills_experience?: string
          status?: string
          terms_agreed?: boolean
          updated_at?: string
          whatsapp_number?: string
          why_join?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          gateway: string | null
          gateway_reference: string | null
          id: string
          metadata: Json | null
          payment_method: string | null
          status: Database["public"]["Enums"]["transaction_status"] | null
          subscription_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          gateway?: string | null
          gateway_reference?: string | null
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          gateway?: string | null
          gateway_reference?: string | null
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_points: {
        Row: {
          id: string
          last_updated: string | null
          rank: number | null
          total_points: number | null
          user_id: string
        }
        Insert: {
          id?: string
          last_updated?: string | null
          rank?: number | null
          total_points?: number | null
          user_id: string
        }
        Update: {
          id?: string
          last_updated?: string | null
          rank?: number | null
          total_points?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_points_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string
          data_collection_analytics: boolean
          data_collection_personalization: boolean
          default_exam_type: string
          difficulty_preference: string
          email_results: boolean
          email_study_tips: boolean
          email_subscription_updates: boolean
          email_test_reminders: boolean
          id: string
          language: string
          onboarding_completed: boolean
          onboarding_completed_at: string | null
          profile_visibility: string
          push_notifications: boolean
          push_notifications_enabled: boolean | null
          push_token: string | null
          show_study_progress: boolean
          show_test_scores: boolean
          sms_results: boolean
          sms_test_reminders: boolean
          test_duration_preference: string
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_collection_analytics?: boolean
          data_collection_personalization?: boolean
          default_exam_type?: string
          difficulty_preference?: string
          email_results?: boolean
          email_study_tips?: boolean
          email_subscription_updates?: boolean
          email_test_reminders?: boolean
          id?: string
          language?: string
          onboarding_completed?: boolean
          onboarding_completed_at?: string | null
          profile_visibility?: string
          push_notifications?: boolean
          push_notifications_enabled?: boolean | null
          push_token?: string | null
          show_study_progress?: boolean
          show_test_scores?: boolean
          sms_results?: boolean
          sms_test_reminders?: boolean
          test_duration_preference?: string
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_collection_analytics?: boolean
          data_collection_personalization?: boolean
          default_exam_type?: string
          difficulty_preference?: string
          email_results?: boolean
          email_study_tips?: boolean
          email_subscription_updates?: boolean
          email_test_reminders?: boolean
          id?: string
          language?: string
          onboarding_completed?: boolean
          onboarding_completed_at?: string | null
          profile_visibility?: string
          push_notifications?: boolean
          push_notifications_enabled?: boolean | null
          push_token?: string | null
          show_study_progress?: boolean
          show_test_scores?: boolean
          sms_results?: boolean
          sms_test_reminders?: boolean
          test_duration_preference?: string
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_streaks: {
        Row: {
          created_at: string | null
          current_streak: number
          id: string
          last_practice_date: string | null
          longest_streak: number
          streak_milestones: Json | null
          total_practice_days: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_streak?: number
          id?: string
          last_practice_date?: string | null
          longest_streak?: number
          streak_milestones?: Json | null
          total_practice_days?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_streak?: number
          id?: string
          last_practice_date?: string | null
          longest_streak?: number
          streak_milestones?: Json | null
          total_practice_days?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_study_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          id: string
          last_accessed_at: string | null
          lesson_id: string
          progress_percent: number | null
          time_spent_minutes: number | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          id?: string
          last_accessed_at?: string | null
          lesson_id: string
          progress_percent?: number | null
          time_spent_minutes?: number | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          id?: string
          last_accessed_at?: string | null
          lesson_id?: string
          progress_percent?: number | null
          time_spent_minutes?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_study_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "study_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_study_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_virtual_accounts: {
        Row: {
          account_name: string
          account_number: string
          bank_name: string
          bank_slug: string | null
          created_at: string
          currency: string
          customer_code: string | null
          id: string
          provider: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_name: string
          account_number: string
          bank_name: string
          bank_slug?: string | null
          created_at?: string
          currency?: string
          customer_code?: string | null
          id?: string
          provider?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_name?: string
          account_number?: string
          bank_name?: string
          bank_slug?: string | null
          created_at?: string
          currency?: string
          customer_code?: string | null
          id?: string
          provider?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_wallets: {
        Row: {
          balance: number | null
          created_at: string | null
          currency: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          academic_stage: string | null
          active_session_token: string | null
          address: string | null
          admin_verified_at: string | null
          auth_user_id: string | null
          country: string | null
          created_at: string | null
          date_of_birth: string | null
          department: string | null
          device_fingerprint: string | null
          email: string
          faculty: string | null
          first_name: string | null
          free_access_expiry_date: string | null
          free_practice_access: boolean | null
          id: string
          institution_id: string | null
          institution_name: string | null
          is_suspended: boolean | null
          is_verified: boolean | null
          last_login_at: string | null
          last_login_ip: unknown
          last_name: string | null
          matric_number: string | null
          phone: string | null
          previous_stage: string | null
          profile_image_url: string | null
          state: string | null
          study_level: string | null
          trial_source: string | null
          trial_started_at: string | null
          two_fa_enabled: boolean | null
          two_fa_secret: string | null
          updated_at: string | null
        }
        Insert: {
          academic_stage?: string | null
          active_session_token?: string | null
          address?: string | null
          admin_verified_at?: string | null
          auth_user_id?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          department?: string | null
          device_fingerprint?: string | null
          email: string
          faculty?: string | null
          first_name?: string | null
          free_access_expiry_date?: string | null
          free_practice_access?: boolean | null
          id?: string
          institution_id?: string | null
          institution_name?: string | null
          is_suspended?: boolean | null
          is_verified?: boolean | null
          last_login_at?: string | null
          last_login_ip?: unknown
          last_name?: string | null
          matric_number?: string | null
          phone?: string | null
          previous_stage?: string | null
          profile_image_url?: string | null
          state?: string | null
          study_level?: string | null
          trial_source?: string | null
          trial_started_at?: string | null
          two_fa_enabled?: boolean | null
          two_fa_secret?: string | null
          updated_at?: string | null
        }
        Update: {
          academic_stage?: string | null
          active_session_token?: string | null
          address?: string | null
          admin_verified_at?: string | null
          auth_user_id?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          department?: string | null
          device_fingerprint?: string | null
          email?: string
          faculty?: string | null
          first_name?: string | null
          free_access_expiry_date?: string | null
          free_practice_access?: boolean | null
          id?: string
          institution_id?: string | null
          institution_name?: string | null
          is_suspended?: boolean | null
          is_verified?: boolean | null
          last_login_at?: string | null
          last_login_ip?: unknown
          last_name?: string | null
          matric_number?: string | null
          phone?: string | null
          previous_stage?: string | null
          profile_image_url?: string | null
          state?: string | null
          study_level?: string | null
          trial_source?: string | null
          trial_started_at?: string | null
          two_fa_enabled?: boolean | null
          two_fa_secret?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      video_progress: {
        Row: {
          completed_percentage: number | null
          created_at: string | null
          id: string
          last_watched_at: string | null
          lesson_id: string
          total_duration_seconds: number
          user_id: string
          watched_duration_seconds: number | null
        }
        Insert: {
          completed_percentage?: number | null
          created_at?: string | null
          id?: string
          last_watched_at?: string | null
          lesson_id: string
          total_duration_seconds: number
          user_id: string
          watched_duration_seconds?: number | null
        }
        Update: {
          completed_percentage?: number | null
          created_at?: string | null
          id?: string
          last_watched_at?: string | null
          lesson_id?: string
          total_duration_seconds?: number
          user_id?: string
          watched_duration_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "video_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "study_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      waec_mock_results: {
        Row: {
          created_at: string
          exam_year: string
          grade: string
          id: string
          remark: string
          school_name: string
          score: number
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exam_year?: string
          grade: string
          id?: string
          remark: string
          school_name?: string
          score: number
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          exam_year?: string
          grade?: string
          id?: string
          remark?: string
          school_name?: string
          score?: number
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "waec_mock_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      waec_result_settings: {
        Row: {
          id: string
          result_published: boolean
          updated_at: string
        }
        Insert: {
          id?: string
          result_published?: boolean
          updated_at?: string
        }
        Update: {
          id?: string
          result_published?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          reference: string | null
          transaction_type: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          balance_before: number
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          reference?: string | null
          transaction_type: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          reference?: string | null
          transaction_type?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "user_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      weak_topic_recommendations: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          last_recommended_at: string | null
          recommended_practice_count: number | null
          subject_id: string
          times_recommended: number | null
          topic_name: string
          user_id: string
          weakness_score: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_recommended_at?: string | null
          recommended_practice_count?: number | null
          subject_id: string
          times_recommended?: number | null
          topic_name: string
          user_id: string
          weakness_score: number
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_recommended_at?: string | null
          recommended_practice_count?: number | null
          subject_id?: string
          times_recommended?: number | null
          topic_name?: string
          user_id?: string
          weakness_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "weak_topic_recommendations_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weak_topic_recommendations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_student_to_school: {
        Args: {
          p_class_level?: string
          p_school_id: string
          p_student_id?: string
          p_user_email: string
        }
        Returns: string
      }
      admin_delete_all_questions: { Args: never; Returns: Json }
      apply_answer_normalization: {
        Args: never
        Returns: {
          failed_count: number
          updated_count: number
        }[]
      }
      auto_schedule_batch: {
        Args: never
        Returns: {
          batch_type: string | null
          created_at: string | null
          exam_date: string | null
          exam_venue: string | null
          id: string
          is_active: boolean | null
          results_release_date: string | null
          results_released: boolean | null
          title: string
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "mock_batches"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      can_send_email: {
        Args: { email_type: string; target_user_id: string }
        Returns: boolean
      }
      can_student_view_exam: {
        Args: { p_exam_id: string; p_school_id: string; p_student_id: string }
        Returns: boolean
      }
      can_view_full_pii: { Args: { target_user_id: string }; Returns: boolean }
      check_admin_rate_limit: { Args: never; Returns: boolean }
      check_auth_rate_limit: { Args: never; Returns: boolean }
      check_email_rate_limit: {
        Args: { recipient_email: string }
        Returns: boolean
      }
      check_mock_result: {
        Args: { p_registration_number: string }
        Returns: Json
      }
      check_otp_send_rate_limit: {
        Args: { p_email: string; p_purpose?: string }
        Returns: Json
      }
      check_rate_limit: {
        Args: {
          endpoint_name: string
          max_requests?: number
          window_minutes?: number
        }
        Returns: boolean
      }
      check_user_lookup_rate_limit: { Args: never; Returns: boolean }
      claim_ebook_access: {
        Args: { _ebook_id: string; _fingerprint: string }
        Returns: Json
      }
      clear_session_token: { Args: { user_auth_id: string }; Returns: boolean }
      compute_exam_results: { Args: { attempt_uuid: string }; Returns: string }
      convert_latex_mathbf_to_markdown: {
        Args: never
        Returns: {
          updated_count: number
        }[]
      }
      create_mock_exam_attempt: {
        Args: {
          p_exam_duration_minutes?: number
          p_exam_id: string
          p_exam_title?: string
          p_registration_id: string
          p_registration_number: string
        }
        Returns: Json
      }
      create_test_school_account: {
        Args: {
          p_admin_name?: string
          p_email?: string
          p_password?: string
          p_school_name?: string
        }
        Returns: Json
      }
      decrement_students_added: {
        Args: { school_id_param: string }
        Returns: undefined
      }
      delete_incomplete_questions: {
        Args: { target_subject?: string }
        Returns: {
          deleted: number
        }[]
      }
      delete_question_safely: { Args: { qid: string }; Returns: boolean }
      delete_user_completely: { Args: { user_uuid: string }; Returns: boolean }
      delete_user_completely_by_app_id: {
        Args: { user_app_id: string }
        Returns: boolean
      }
      expire_subscriptions: { Args: never; Returns: undefined }
      find_incomplete_questions: {
        Args: never
        Returns: {
          id: string
          reason: string
        }[]
      }
      fix_latex_questions: {
        Args: { target_subject?: string }
        Returns: {
          updated_count: number
        }[]
      }
      generate_mock_reg_number: { Args: never; Returns: string }
      generate_professional_school_code: { Args: never; Returns: string }
      generate_referral_code: { Args: never; Returns: string }
      generate_school_code: { Args: { school_name: string }; Returns: string }
      generate_school_code_from_name: {
        Args: { school_name: string }
        Returns: string
      }
      generate_unique_referral_code: { Args: never; Returns: string }
      generate_weak_topic_recommendations: {
        Args: { p_user_id: string }
        Returns: {
          recommended_count: number
          subject_name: string
          topic_name: string
          weakness_score: number
        }[]
      }
      get_admin_proctoring_data: {
        Args: never
        Returns: {
          device_fingerprint: string
          email: string
          exam_id: string
          first_name: string
          id: string
          ip_address: unknown
          last_name: string
          proctoring_data: Json
          started_at: string
          status: Database["public"]["Enums"]["attempt_status"]
          submitted_at: string
          suspicious_activity_count: number
          user_agent: string
          user_id: string
        }[]
      }
      get_daily_import_count: { Args: { _provider: string }; Returns: number }
      get_exam_questions: {
        Args: { exam_question_ids: string[] }
        Returns: {
          difficulty_level: number
          id: string
          media_urls: Json
          options: Json
          points: number
          question_text: string
          subject_id: string
          tags: Json
          time_limit_seconds: number
          type: Database["public"]["Enums"]["question_type"]
        }[]
      }
      get_exam_questions_secure: {
        Args: { exam_question_ids: string[] }
        Returns: {
          difficulty_level: number
          id: string
          media_urls: Json
          options: Json
          points: number
          question_text: string
          subject_id: string
          tags: Json
          time_limit_seconds: number
          type: Database["public"]["Enums"]["question_type"]
        }[]
      }
      get_leaderboard: {
        Args: { p_limit?: number; p_period?: string }
        Returns: {
          avg_score: number
          display_name: string
          is_me: boolean
          rank: number
          tests: number
          user_id: string
        }[]
      }
      get_my_leaderboard_rank: {
        Args: { p_period?: string }
        Returns: {
          avg_score: number
          qualified: boolean
          rank: number
          tests: number
          total: number
        }[]
      }
      get_question_explanation: {
        Args: { question_id: string; user_id: string }
        Returns: string
      }
      get_question_explanation_secure: {
        Args: { question_id_param: string }
        Returns: {
          correct_answer: Json
          explanation: string
        }[]
      }
      get_random_questions_for_exam: {
        Args: { target_exam_body?: string; target_exam_id: string }
        Returns: {
          difficulty_level: number
          id: string
          media_urls: Json
          option_media: Json
          options: Json
          points: number
          question_text: string
          subject_id: string
          tags: Json
          time_limit_seconds: number
          type: Database["public"]["Enums"]["question_type"]
        }[]
      }
      get_random_questions_for_subjects: {
        Args: {
          per_subject_count?: number
          subject_ids: string[]
          target_exam_body?: string
        }
        Returns: {
          difficulty_level: number
          id: string
          media_urls: Json
          option_media: Json
          options: Json
          points: number
          question_text: string
          subject_id: string
          tags: Json
          time_limit_seconds: number
          type: Database["public"]["Enums"]["question_type"]
        }[]
      }
      get_registration_for_admit: {
        Args: { p_registration_number: string }
        Returns: Json
      }
      get_review_questions_for_attempt: {
        Args: { attempt_uuid: string }
        Returns: {
          correct_answer_index: number
          explanation: string
          id: string
          is_correct: boolean
          media_urls: Json
          option_media: Json
          options: Json
          question_text: string
          subject_id: string
          subject_name: string
          time_spent_seconds: number
          user_answer_index: number
        }[]
      }
      get_school_subscription_status: {
        Args: { target_school_id: string }
        Returns: {
          end_date: string
          is_active: boolean
          plan_name: string
          student_seats: number
          used_seats: number
        }[]
      }
      get_secure_user_data: {
        Args: { target_user_id: string }
        Returns: {
          auth_user_id: string
          country: string
          created_at: string
          email: string
          first_name: string
          id: string
          is_suspended: boolean
          is_verified: boolean
          last_login_at: string
          last_name: string
          phone: string
          state: string
          updated_at: string
        }[]
      }
      get_student_attempt_data: {
        Args: { target_attempt_id: string }
        Returns: {
          created_at: string
          device_info: string
          exam_id: string
          id: string
          security_score: number
          selected_subjects: Json
          started_at: string
          status: Database["public"]["Enums"]["attempt_status"]
          submitted_at: string
          time_remaining_seconds: number
          user_id: string
        }[]
      }
      get_student_bookings: {
        Args: never
        Returns: {
          created_at: string
          description: string
          duration_minutes: number
          id: string
          is_paid: boolean
          meeting_link: string
          notes: string
          payment_status: string
          price: number
          start_time: string
          status: Database["public"]["Enums"]["booking_status"]
          subject_id: string
          title: string
          tutor_id: string
          user_id: string
        }[]
      }
      get_student_exam_progress: {
        Args: never
        Returns: {
          created_at: string
          exam_id: string
          id: string
          proctoring_data: Json
          security_score: number
          selected_subjects: Json
          started_at: string
          status: Database["public"]["Enums"]["attempt_status"]
          submitted_at: string
          time_remaining_seconds: number
          user_id: string
        }[]
      }
      get_student_exam_questions: {
        Args: { attempt_id_param: string }
        Returns: {
          difficulty_level: number
          id: string
          media_urls: Json
          options: Json
          points: number
          question_text: string
          subject_id: string
          tags: Json
          time_limit_seconds: number
          type: Database["public"]["Enums"]["question_type"]
        }[]
      }
      get_subject_question_counts: {
        Args: never
        Returns: {
          question_count: number
          subject_id: string
        }[]
      }
      get_subject_question_counts_by_exam: {
        Args: { target_exam_body?: string }
        Returns: {
          question_count: number
          subject_id: string
          tagged_count: number
          untagged_count: number
        }[]
      }
      get_user_effective_subscription: {
        Args: { target_user_id: string }
        Returns: {
          end_date: string
          id: string
          plan_id: string
          plan_name: string
          price: number
          resource_access_level: string
          source: string
          start_date: string
          status: string
        }[]
      }
      get_user_role: {
        Args: { _auth_user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_safe_data: {
        Args: { target_user_id: string }
        Returns: {
          address: string
          auth_user_id: string
          country: string
          created_at: string
          date_of_birth: string
          email: string
          first_name: string
          id: string
          is_suspended: boolean
          is_verified: boolean
          last_name: string
          phone: string
          profile_image_url: string
          state: string
          updated_at: string
        }[]
      }
      get_user_secure: {
        Args: { target_user_id: string }
        Returns: {
          address: string
          auth_user_id: string
          country: string
          created_at: string
          date_of_birth: string
          email: string
          first_name: string
          id: string
          is_suspended: boolean
          is_verified: boolean
          last_name: string
          phone: string
          profile_image_url: string
          state: string
          updated_at: string
        }[]
      }
      get_users_masked: {
        Args: never
        Returns: {
          address: string
          auth_user_id: string
          country: string
          created_at: string
          date_of_birth: string
          device_fingerprint_masked: string
          email: string
          first_name: string
          id: string
          is_suspended: boolean
          is_verified: boolean
          last_login_at: string
          last_login_ip_masked: string
          last_name: string
          phone: string
          profile_image_url: string
          state: string
          updated_at: string
        }[]
      }
      grant_ebook_access_by_email: {
        Args: { _ebook_id: string; _email: string; _expires_at?: string }
        Returns: Json
      }
      has_ebook_access: {
        Args: { _ebook_id: string; _user_id: string }
        Returns: boolean
      }
      has_premium_access: { Args: { _auth_user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_scope_access: {
        Args: { _auth_user_id: string; _scope: string }
        Returns: boolean
      }
      increment_students_added: {
        Args: { school_id_param: string }
        Returns: undefined
      }
      insert_manual_result: {
        Args: {
          student_id: string
          subjects: Json
          time_taken_minutes?: number
        }
        Returns: undefined
      }
      institution_service_fee: { Args: { _form_fee: number }; Returns: number }
      is_account_locked: { Args: { user_email: string }; Returns: boolean }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_ebook_admin: { Args: { _user_id: string }; Returns: boolean }
      is_school_admin: {
        Args: { target_school_id: string; user_auth_id: string }
        Returns: boolean
      }
      is_session_valid: {
        Args: { token_to_check: string; user_auth_id: string }
        Returns: boolean
      }
      leaderboard_period_start: { Args: { p_period: string }; Returns: string }
      log_admin_action: {
        Args: { action_type: string; admin_id: string; target_id?: string }
        Returns: boolean
      }
      log_admin_pii_access: {
        Args: {
          access_type: string
          accessed_fields?: string[]
          target_user_id: string
        }
        Returns: undefined
      }
      log_pii_access: {
        Args: { access_type: string; accessed_user_id: string }
        Returns: undefined
      }
      log_security_event: {
        Args: {
          details?: Json
          event_type: string
          target_id?: string
          target_table: string
        }
        Returns: undefined
      }
      mask_email: { Args: { email: string }; Returns: string }
      mask_phone: { Args: { phone: string }; Returns: string }
      monitor_security_events: {
        Args: never
        Returns: {
          event_count: number
          event_type: string
          last_occurrence: string
          severity: string
        }[]
      }
      normalize_question_answers: {
        Args: never
        Returns: {
          new_format: number
          old_format: string
          question_id: string
          status: string
        }[]
      }
      notify_all_users: {
        Args: {
          notification_message: string
          notification_metadata?: Json
          notification_title: string
          notification_type?: string
        }
        Returns: undefined
      }
      notify_premium_users: {
        Args: {
          notification_message: string
          notification_metadata?: Json
          notification_title: string
          notification_type?: string
        }
        Returns: undefined
      }
      process_referral_signup: {
        Args: { new_user_id: string; referral_code_param: string }
        Returns: boolean
      }
      recompute_results_for_attempt: {
        Args: { attempt_uuid: string }
        Returns: {
          correct: number
          percentage: number
          scaled_score: number
          total: number
          unanswered: number
          updated: boolean
          wrong: number
        }[]
      }
      recompute_results_for_mock_attempt: {
        Args: { attempt_uuid: string }
        Returns: {
          correct: number
          percentage: number
          scaled_score: number
          total: number
          unanswered: number
          updated: boolean
          wrong: number
        }[]
      }
      record_login_attempt: {
        Args: {
          attempt_success: boolean
          user_email: string
          user_ip?: unknown
        }
        Returns: undefined
      }
      redeem_ebook_code: {
        Args: { _code: string; _device: string; _name: string }
        Returns: Json
      }
      redeem_promo_coupon: { Args: { coupon_code: string }; Returns: Json }
      reset_ebook_device: { Args: { _access_id: string }; Returns: Json }
      send_immediate_result_notification: {
        Args: { attempt_uuid: string }
        Returns: boolean
      }
      submit_mock_exam: { Args: { p_attempt_id: string }; Returns: Json }
      submit_mock_exam_answers: {
        Args: { p_answers: Json; p_attempt_id: string }
        Returns: Json
      }
      submit_mock_result: {
        Args: {
          p_batch_id: string
          p_max_score: number
          p_registration_number: string
          p_strengths: Json
          p_subject_scores: Json
          p_total_score: number
          p_weaknesses: Json
        }
        Returns: Json
      }
      update_user_streak: { Args: { p_user_id: string }; Returns: Json }
      validate_admin_action: {
        Args: { action_type: string; target_data?: Json }
        Returns: boolean
      }
      validate_and_set_session_token: {
        Args: { new_token: string; user_auth_id: string }
        Returns: boolean
      }
      validate_answer_simple: {
        Args: { question_id_param: string; submitted_index: number }
        Returns: boolean
      }
      validate_mock_exam_login: {
        Args: { p_registration_number: string }
        Returns: Json
      }
      validate_question_answer: {
        Args: { question_id: string; submitted_answer: Json }
        Returns: boolean
      }
      validate_role_assignment: {
        Args: {
          role_to_assign: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Returns: boolean
      }
      validate_student_answer: {
        Args: { question_id_param: string; submitted_answer: Json }
        Returns: boolean
      }
      validate_user_input: {
        Args: { input_data: Json; validation_rules: Json }
        Returns: boolean
      }
      verify_virtual_student: {
        Args: { p_attempt_id?: string; p_reg_number: string }
        Returns: Json
      }
      wallet_credit: {
        Args: {
          p_amount: number
          p_description?: string
          p_metadata?: Json
          p_reference: string
          p_user_id: string
        }
        Returns: number
      }
      wallet_debit: {
        Args: {
          p_amount: number
          p_description?: string
          p_metadata?: Json
          p_reference: string
          p_user_id: string
        }
        Returns: number
      }
      wallet_ensure: { Args: { p_user_id: string }; Returns: string }
      wallet_resolve_user_id: { Args: { p_user_id: string }; Returns: string }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "admin"
        | "tutor"
        | "student"
        | "school_admin"
        | "school_student"
      attempt_status:
        | "STARTED"
        | "IN_PROGRESS"
        | "SUBMITTED"
        | "GRADED"
        | "SUSPENDED"
      booking_status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED"
      course_category: "science" | "art" | "management"
      exam_type: "JAMB" | "WAEC" | "CUSTOM"
      question_type:
        | "MCQ_SINGLE"
        | "MCQ_MULTI"
        | "TRUE_FALSE"
        | "FILL_IN"
        | "MATCHING"
        | "ESSAY"
      subscription_status: "ACTIVE" | "EXPIRED" | "CANCELLED" | "TRIAL"
      transaction_status: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "super_admin",
        "admin",
        "tutor",
        "student",
        "school_admin",
        "school_student",
      ],
      attempt_status: [
        "STARTED",
        "IN_PROGRESS",
        "SUBMITTED",
        "GRADED",
        "SUSPENDED",
      ],
      booking_status: ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"],
      course_category: ["science", "art", "management"],
      exam_type: ["JAMB", "WAEC", "CUSTOM"],
      question_type: [
        "MCQ_SINGLE",
        "MCQ_MULTI",
        "TRUE_FALSE",
        "FILL_IN",
        "MATCHING",
        "ESSAY",
      ],
      subscription_status: ["ACTIVE", "EXPIRED", "CANCELLED", "TRIAL"],
      transaction_status: ["PENDING", "SUCCESS", "FAILED", "REFUNDED"],
    },
  },
} as const
