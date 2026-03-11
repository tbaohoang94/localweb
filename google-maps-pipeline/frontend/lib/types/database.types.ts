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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      businesses: {
        Row: {
          address: string | null
          category: string | null
          cid: string | null
          city: string | null
          claimed: boolean | null
          country: string | null
          created_at: string | null
          enriched_at: string | null
          fid: string | null
          google_maps_url: string | null
          id: string
          im_contact_name: string | null
          im_email: string | null
          im_tel: string | null
          images_count: number | null
          last_error: string | null
          latitude: number | null
          longitude: number | null
          name: string
          neighborhood: string | null
          opening_hours: Json | null
          permanently_closed: boolean | null
          phone: string | null
          phone_unformatted: string | null
          pipeline_stage: Database["public"]["Enums"]["business_pipeline_stage"]
          place_id: string
          postal_code: string | null
          qualification_reason: string | null
          qualified_at: string | null
          rank: number | null
          rating: number | null
          retry_count: number
          reviews_count: number | null
          search_string: string | null
          street: string | null
          updated_at: string | null
          website: string | null
          website_summary: string | null
        }
        Insert: {
          address?: string | null
          category?: string | null
          cid?: string | null
          city?: string | null
          claimed?: boolean | null
          country?: string | null
          created_at?: string | null
          enriched_at?: string | null
          fid?: string | null
          google_maps_url?: string | null
          id?: string
          im_contact_name?: string | null
          im_email?: string | null
          im_tel?: string | null
          images_count?: number | null
          last_error?: string | null
          latitude?: number | null
          longitude?: number | null
          name: string
          neighborhood?: string | null
          opening_hours?: Json | null
          permanently_closed?: boolean | null
          phone?: string | null
          phone_unformatted?: string | null
          pipeline_stage?: Database["public"]["Enums"]["business_pipeline_stage"]
          place_id: string
          postal_code?: string | null
          qualification_reason?: string | null
          qualified_at?: string | null
          rank?: number | null
          rating?: number | null
          retry_count?: number
          reviews_count?: number | null
          search_string?: string | null
          street?: string | null
          updated_at?: string | null
          website?: string | null
          website_summary?: string | null
        }
        Update: {
          address?: string | null
          category?: string | null
          cid?: string | null
          city?: string | null
          claimed?: boolean | null
          country?: string | null
          created_at?: string | null
          enriched_at?: string | null
          fid?: string | null
          google_maps_url?: string | null
          id?: string
          im_contact_name?: string | null
          im_email?: string | null
          im_tel?: string | null
          images_count?: number | null
          last_error?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          neighborhood?: string | null
          opening_hours?: Json | null
          permanently_closed?: boolean | null
          phone?: string | null
          phone_unformatted?: string | null
          pipeline_stage?: Database["public"]["Enums"]["business_pipeline_stage"]
          place_id?: string
          postal_code?: string | null
          qualification_reason?: string | null
          qualified_at?: string | null
          rank?: number | null
          rating?: number | null
          retry_count?: number
          reviews_count?: number | null
          search_string?: string | null
          street?: string | null
          updated_at?: string | null
          website?: string | null
          website_summary?: string | null
        }
        Relationships: []
      }
      category_qualifications: {
        Row: {
          category: string
          created_at: string
          id: string
          keyword: string
          reason: string | null
          relevant: boolean
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          keyword: string
          reason?: string | null
          relevant: boolean
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          keyword?: string
          reason?: string | null
          relevant?: boolean
        }
        Relationships: []
      }
      cities: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          id: number
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          id?: number
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      custom_fields: {
        Row: {
          close_field_id: string
          created_at: string | null
          entity_type: string
          field_type: string | null
          id: string
          name: string
          synced_at: string | null
        }
        Insert: {
          close_field_id: string
          created_at?: string | null
          entity_type: string
          field_type?: string | null
          id?: string
          name: string
          synced_at?: string | null
        }
        Update: {
          close_field_id?: string
          created_at?: string | null
          entity_type?: string
          field_type?: string | null
          id?: string
          name?: string
          synced_at?: string | null
        }
        Relationships: []
      }
      dead_letter_queue: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          last_retry_at: string | null
          max_retries: number | null
          payload: Json
          retry_count: number | null
          source_workflow: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          last_retry_at?: string | null
          max_retries?: number | null
          payload: Json
          retry_count?: number | null
          source_workflow: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          last_retry_at?: string | null
          max_retries?: number | null
          payload?: Json
          retry_count?: number | null
          source_workflow?: string
          status?: string | null
        }
        Relationships: []
      }
      locations: {
        Row: {
          apify_run_id: string | null
          city: string
          country: string
          created_at: string | null
          id: string
          last_error: string | null
          latitude: number | null
          longitude: number | null
          pipeline_stage: Database["public"]["Enums"]["location_pipeline_stage"]
          query: string
          retry_count: number
          scrape_finished_at: string | null
          scrape_total_results: number | null
          scraped_at: string | null
          updated_at: string | null
        }
        Insert: {
          apify_run_id?: string | null
          city: string
          country: string
          created_at?: string | null
          id?: string
          last_error?: string | null
          latitude?: number | null
          longitude?: number | null
          pipeline_stage?: Database["public"]["Enums"]["location_pipeline_stage"]
          query: string
          retry_count?: number
          scrape_finished_at?: string | null
          scrape_total_results?: number | null
          scraped_at?: string | null
          updated_at?: string | null
        }
        Update: {
          apify_run_id?: string | null
          city?: string
          country?: string
          created_at?: string | null
          id?: string
          last_error?: string | null
          latitude?: number | null
          longitude?: number | null
          pipeline_stage?: Database["public"]["Enums"]["location_pipeline_stage"]
          query?: string
          retry_count?: number
          scrape_finished_at?: string | null
          scrape_total_results?: number | null
          scraped_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          error_stack: string | null
          id: string
          input_data: Json | null
          metadata: Json | null
          severity: string
          source: string
          workflow_name: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          error_stack?: string | null
          id?: string
          input_data?: Json | null
          metadata?: Json | null
          severity: string
          source: string
          workflow_name?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          error_stack?: string | null
          id?: string
          input_data?: Json | null
          metadata?: Json | null
          severity?: string
          source?: string
          workflow_name?: string | null
        }
        Relationships: []
      }
      workflow_logs: {
        Row: {
          created_at: string | null
          details: Json | null
          duration_ms: number | null
          error_message: string | null
          error_node: string | null
          execution_id: string | null
          id: string
          items_count: number | null
          run_date: string
          status: string
          workflow_name: string
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          duration_ms?: number | null
          error_message?: string | null
          error_node?: string | null
          execution_id?: string | null
          id?: string
          items_count?: number | null
          run_date?: string
          status: string
          workflow_name: string
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          duration_ms?: number | null
          error_message?: string | null
          error_node?: string | null
          execution_id?: string | null
          id?: string
          items_count?: number | null
          run_date?: string
          status?: string
          workflow_name?: string
        }
        Relationships: []
      }
    }
    Views: {
      business_throughput: {
        Row: {
          day: string | null
          enriched: number | null
          exported: number | null
          failed: number | null
          qualified: number | null
          total: number | null
          unqualified: number | null
        }
        Relationships: []
      }
      location_throughput: {
        Row: {
          day: string | null
          failed: number | null
          imported: number | null
          scraped: number | null
          total: number | null
        }
        Relationships: []
      }
      pipeline_counts: {
        Row: {
          count: number | null
          pipeline_stage: string | null
          source: string | null
        }
        Relationships: []
      }
      pipeline_errors: {
        Row: {
          city: string | null
          entity_type: string | null
          id: string | null
          last_error: string | null
          name: string | null
          retry_count: number | null
          stage: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      search_query_stats: {
        Row: {
          exported: number | null
          qualified: number | null
          search_string: string | null
          terminal: number | null
          total: number | null
          with_contact: number | null
          with_website: number | null
        }
        Relationships: []
      }
      system_logs_summary: {
        Row: {
          last_occurrence: string | null
          log_count: number | null
          severity: string | null
          source: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      business_pipeline_stage:
        | "new"
        | "qualified"
        | "unqualified"
        | "enriching"
        | "enriched"
        | "failed_enrich"
        | "exported"
      location_pipeline_stage:
        | "new"
        | "scraping"
        | "scraped"
        | "imported"
        | "failed_scrape"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      business_pipeline_stage: [
        "new",
        "qualified",
        "unqualified",
        "enriching",
        "enriched",
        "failed_enrich",
        "exported",
      ],
      location_pipeline_stage: [
        "new",
        "scraping",
        "scraped",
        "imported",
        "failed_scrape",
      ],
    },
  },
} as const
