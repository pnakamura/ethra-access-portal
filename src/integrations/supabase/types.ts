export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string | null
          details: Json | null
          id: string
          target_email: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
          target_email?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          target_email?: string | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_log_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      assinaturas: {
        Row: {
          atualizado_em: string | null
          ciclo_faturamento:
            | Database["public"]["Enums"]["tipo_ciclo_faturamento"]
            | null
          criado_em: string | null
          data_fim: string | null
          data_inicio: string
          id: string
          pagamento_id: string | null
          plano_id: string
          renovacao_automatica: boolean | null
          status: Database["public"]["Enums"]["tipo_status_assinatura"]
          usuario_id: string
        }
        Insert: {
          atualizado_em?: string | null
          ciclo_faturamento?:
            | Database["public"]["Enums"]["tipo_ciclo_faturamento"]
            | null
          criado_em?: string | null
          data_fim?: string | null
          data_inicio: string
          id?: string
          pagamento_id?: string | null
          plano_id: string
          renovacao_automatica?: boolean | null
          status: Database["public"]["Enums"]["tipo_status_assinatura"]
          usuario_id: string
        }
        Update: {
          atualizado_em?: string | null
          ciclo_faturamento?:
            | Database["public"]["Enums"]["tipo_ciclo_faturamento"]
            | null
          criado_em?: string | null
          data_fim?: string | null
          data_inicio?: string
          id?: string
          pagamento_id?: string | null
          plano_id?: string
          renovacao_automatica?: boolean | null
          status?: Database["public"]["Enums"]["tipo_status_assinatura"]
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assinaturas_pagamento_id_fkey"
            columns: ["pagamento_id"]
            isOneToOne: false
            referencedRelation: "pagamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assinaturas_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assinaturas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias_refeicao: {
        Row: {
          descricao: string | null
          id: string
          nome: string
          ordem: number | null
        }
        Insert: {
          descricao?: string | null
          id?: string
          nome: string
          ordem?: number | null
        }
        Update: {
          descricao?: string | null
          id?: string
          nome?: string
          ordem?: number | null
        }
        Relationships: []
      }
      dependentes: {
        Row: {
          atualizado_em: string | null
          celular: string | null
          criado_em: string | null
          deletado_em: string | null
          email: string
          id: string
          nome_completo: string
          usuario_id: string
        }
        Insert: {
          atualizado_em?: string | null
          celular?: string | null
          criado_em?: string | null
          deletado_em?: string | null
          email: string
          id?: string
          nome_completo: string
          usuario_id: string
        }
        Update: {
          atualizado_em?: string | null
          celular?: string | null
          criado_em?: string | null
          deletado_em?: string | null
          email?: string
          id?: string
          nome_completo?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dependentes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      informacoes_nutricionais: {
        Row: {
          calorias: number | null
          carboidratos: number | null
          categoria_refeicao_id: string | null
          dados_n8n: Json | null
          dados_raw_ia: Json | null
          data_registro: string | null
          deletado_em: string | null
          descricao_ia: string | null
          gorduras: number | null
          id: string
          proteinas: number | null
          usuario_id: string
        }
        Insert: {
          calorias?: number | null
          carboidratos?: number | null
          categoria_refeicao_id?: string | null
          dados_n8n?: Json | null
          dados_raw_ia?: Json | null
          data_registro?: string | null
          deletado_em?: string | null
          descricao_ia?: string | null
          gorduras?: number | null
          id?: string
          proteinas?: number | null
          usuario_id: string
        }
        Update: {
          calorias?: number | null
          carboidratos?: number | null
          categoria_refeicao_id?: string | null
          dados_n8n?: Json | null
          dados_raw_ia?: Json | null
          data_registro?: string | null
          deletado_em?: string | null
          descricao_ia?: string | null
          gorduras?: number | null
          id?: string
          proteinas?: number | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "informacoes_nutricionais_categoria_refeicao_id_fkey"
            columns: ["categoria_refeicao_id"]
            isOneToOne: false
            referencedRelation: "categorias_refeicao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "informacoes_nutricionais_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      lembretes_automaticos: {
        Row: {
          ativo: boolean | null
          criado_em: string | null
          deletado_em: string | null
          dias_semana: string
          horario: string
          id: string
          tipo_lembrete: Database["public"]["Enums"]["tipo_lembrete"]
          usuario_id: string
        }
        Insert: {
          ativo?: boolean | null
          criado_em?: string | null
          deletado_em?: string | null
          dias_semana: string
          horario: string
          id?: string
          tipo_lembrete: Database["public"]["Enums"]["tipo_lembrete"]
          usuario_id: string
        }
        Update: {
          ativo?: boolean | null
          criado_em?: string | null
          deletado_em?: string | null
          dias_semana?: string
          horario?: string
          id?: string
          tipo_lembrete?: Database["public"]["Enums"]["tipo_lembrete"]
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lembretes_automaticos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      metas_usuario: {
        Row: {
          agua_diaria_ml: number | null
          atualizado_em: string | null
          calorias_diarias: number | null
          peso_objetivo: number | null
          usuario_id: string
        }
        Insert: {
          agua_diaria_ml?: number | null
          atualizado_em?: string | null
          calorias_diarias?: number | null
          peso_objetivo?: number | null
          usuario_id: string
        }
        Update: {
          agua_diaria_ml?: number | null
          atualizado_em?: string | null
          calorias_diarias?: number | null
          peso_objetivo?: number | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "metas_usuario_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          horario_notificacoes: string | null
          lembrete_agua: boolean | null
          lembrete_refeicao: boolean | null
          usuario_id: string
        }
        Insert: {
          horario_notificacoes?: string | null
          lembrete_agua?: boolean | null
          lembrete_refeicao?: boolean | null
          usuario_id: string
        }
        Update: {
          horario_notificacoes?: string | null
          lembrete_agua?: boolean | null
          lembrete_refeicao?: boolean | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      objetivos_usuario: {
        Row: {
          data_inicio: string
          data_meta: string | null
          descricao: string | null
          nivel_dificuldade:
            | Database["public"]["Enums"]["tipo_nivel_dificuldade"]
            | null
          peso_desejado: number | null
          taxa_semanal_esperada: number | null
          tipo_objetivo: Database["public"]["Enums"]["tipo_objetivo"]
          usuario_id: string
        }
        Insert: {
          data_inicio: string
          data_meta?: string | null
          descricao?: string | null
          nivel_dificuldade?:
            | Database["public"]["Enums"]["tipo_nivel_dificuldade"]
            | null
          peso_desejado?: number | null
          taxa_semanal_esperada?: number | null
          tipo_objetivo: Database["public"]["Enums"]["tipo_objetivo"]
          usuario_id: string
        }
        Update: {
          data_inicio?: string
          data_meta?: string | null
          descricao?: string | null
          nivel_dificuldade?:
            | Database["public"]["Enums"]["tipo_nivel_dificuldade"]
            | null
          peso_desejado?: number | null
          taxa_semanal_esperada?: number | null
          tipo_objetivo?: Database["public"]["Enums"]["tipo_objetivo"]
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "objetivos_usuario_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamentos: {
        Row: {
          codigo_transacao: string
          data_pagamento: string | null
          deletado_em: string | null
          forma_pagamento: string
          id: string
          plano_id: string
          status_pagamento: Database["public"]["Enums"]["tipo_status_pagamento"]
          usuario_id: string
          valor_pago: number
        }
        Insert: {
          codigo_transacao: string
          data_pagamento?: string | null
          deletado_em?: string | null
          forma_pagamento: string
          id?: string
          plano_id: string
          status_pagamento: Database["public"]["Enums"]["tipo_status_pagamento"]
          usuario_id: string
          valor_pago: number
        }
        Update: {
          codigo_transacao?: string
          data_pagamento?: string | null
          deletado_em?: string | null
          forma_pagamento?: string
          id?: string
          plano_id?: string
          status_pagamento?: Database["public"]["Enums"]["tipo_status_pagamento"]
          usuario_id?: string
          valor_pago?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      planos: {
        Row: {
          ativo: boolean | null
          criado_em: string | null
          deletado_em: string | null
          descricao: string | null
          eh_plano_gestor: boolean | null
          id: string
          nome_plano: string
          valor: number
        }
        Insert: {
          ativo?: boolean | null
          criado_em?: string | null
          deletado_em?: string | null
          descricao?: string | null
          eh_plano_gestor?: boolean | null
          id?: string
          nome_plano: string
          valor: number
        }
        Update: {
          ativo?: boolean | null
          criado_em?: string | null
          deletado_em?: string | null
          descricao?: string | null
          eh_plano_gestor?: boolean | null
          id?: string
          nome_plano?: string
          valor?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          peso_atual_kg: number | null
          plano_id: string | null
          role: string | null
          updated_at: string
          user_id: string
          whatsapp_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          peso_atual_kg?: number | null
          plano_id?: string | null
          role?: string | null
          updated_at?: string
          user_id: string
          whatsapp_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          peso_atual_kg?: number | null
          plano_id?: string | null
          role?: string | null
          updated_at?: string
          user_id?: string
          whatsapp_id?: string | null
        }
        Relationships: []
      }
      registro_exercicios: {
        Row: {
          calorias_gastas: number | null
          data_exercicio: string
          deletado_em: string | null
          duracao_minutos: number | null
          id: string
          intensidade:
            | Database["public"]["Enums"]["tipo_intensidade_exercicio"]
            | null
          observacoes: string | null
          tipo_exercicio: string
          usuario_id: string
        }
        Insert: {
          calorias_gastas?: number | null
          data_exercicio?: string
          deletado_em?: string | null
          duracao_minutos?: number | null
          id?: string
          intensidade?:
            | Database["public"]["Enums"]["tipo_intensidade_exercicio"]
            | null
          observacoes?: string | null
          tipo_exercicio: string
          usuario_id: string
        }
        Update: {
          calorias_gastas?: number | null
          data_exercicio?: string
          deletado_em?: string | null
          duracao_minutos?: number | null
          id?: string
          intensidade?:
            | Database["public"]["Enums"]["tipo_intensidade_exercicio"]
            | null
          observacoes?: string | null
          tipo_exercicio?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registro_exercicios_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      registro_hidratacao: {
        Row: {
          deletado_em: string | null
          horario: string | null
          id: string
          quantidade_ml: number
          tipo_liquido: Database["public"]["Enums"]["tipo_liquido"] | null
          usuario_id: string
        }
        Insert: {
          deletado_em?: string | null
          horario?: string | null
          id?: string
          quantidade_ml: number
          tipo_liquido?: Database["public"]["Enums"]["tipo_liquido"] | null
          usuario_id: string
        }
        Update: {
          deletado_em?: string | null
          horario?: string | null
          id?: string
          quantidade_ml?: number
          tipo_liquido?: Database["public"]["Enums"]["tipo_liquido"] | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registro_hidratacao_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      registro_medidas: {
        Row: {
          altura_cm: number | null
          circunferencia_cintura: number | null
          circunferencia_quadril: number | null
          data_registro: string
          deletado_em: string | null
          id: string
          usuario_id: string
        }
        Insert: {
          altura_cm?: number | null
          circunferencia_cintura?: number | null
          circunferencia_quadril?: number | null
          data_registro?: string
          deletado_em?: string | null
          id?: string
          usuario_id: string
        }
        Update: {
          altura_cm?: number | null
          circunferencia_cintura?: number | null
          circunferencia_quadril?: number | null
          data_registro?: string
          deletado_em?: string | null
          id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registro_medidas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      registro_peso: {
        Row: {
          data_registro: string
          deletado_em: string | null
          id: string
          observacoes: string | null
          peso_kg: number
          usuario_id: string
        }
        Insert: {
          data_registro?: string
          deletado_em?: string | null
          id?: string
          observacoes?: string | null
          peso_kg: number
          usuario_id: string
        }
        Update: {
          data_registro?: string
          deletado_em?: string | null
          id?: string
          observacoes?: string | null
          peso_kg?: number
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registro_peso_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      relatorios_semanais: {
        Row: {
          comparacao_semanal: Json | null
          criado_em: string | null
          dados_nutricionais: Json
          data_fim: string
          data_inicio: string
          enviado_em: string | null
          id: string
          insights: string | null
          status_envio: Database["public"]["Enums"]["tipo_status_envio"] | null
          usuario_id: string
        }
        Insert: {
          comparacao_semanal?: Json | null
          criado_em?: string | null
          dados_nutricionais: Json
          data_fim: string
          data_inicio: string
          enviado_em?: string | null
          id?: string
          insights?: string | null
          status_envio?: Database["public"]["Enums"]["tipo_status_envio"] | null
          usuario_id: string
        }
        Update: {
          comparacao_semanal?: Json | null
          criado_em?: string | null
          dados_nutricionais?: Json
          data_fim?: string
          data_inicio?: string
          enviado_em?: string | null
          id?: string
          insights?: string | null
          status_envio?: Database["public"]["Enums"]["tipo_status_envio"] | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "relatorios_semanais_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          admin_responsavel_id: string | null
          atualizado_em: string | null
          celular: string | null
          email: string | null
          id: string
          nome_completo: string | null
          peso_atual_kg: number | null
          plano_id: string | null
          tipo_usuario: Database["public"]["Enums"]["tipo_usuario"] | null
          whatsapp_id: string | null
        }
        Insert: {
          admin_responsavel_id?: string | null
          atualizado_em?: string | null
          celular?: string | null
          email?: string | null
          id: string
          nome_completo?: string | null
          peso_atual_kg?: number | null
          plano_id?: string | null
          tipo_usuario?: Database["public"]["Enums"]["tipo_usuario"] | null
          whatsapp_id?: string | null
        }
        Update: {
          admin_responsavel_id?: string | null
          atualizado_em?: string | null
          celular?: string | null
          email?: string | null
          id?: string
          nome_completo?: string | null
          peso_atual_kg?: number | null
          plano_id?: string | null
          tipo_usuario?: Database["public"]["Enums"]["tipo_usuario"] | null
          whatsapp_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_admin_responsavel"
            columns: ["admin_responsavel_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuarios_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios_admin: {
        Row: {
          atualizado_em: string | null
          data_ativacao: string | null
          data_expiracao_plano: string | null
          id: string
          max_dependentes: number | null
          notificacoes_habilitadas: boolean | null
          plano_ativo: boolean | null
          pode_gerenciar_planos: boolean | null
          pode_visualizar_tudo: boolean | null
          usuario_id: string
        }
        Insert: {
          atualizado_em?: string | null
          data_ativacao?: string | null
          data_expiracao_plano?: string | null
          id?: string
          max_dependentes?: number | null
          notificacoes_habilitadas?: boolean | null
          plano_ativo?: boolean | null
          pode_gerenciar_planos?: boolean | null
          pode_visualizar_tudo?: boolean | null
          usuario_id: string
        }
        Update: {
          atualizado_em?: string | null
          data_ativacao?: string | null
          data_expiracao_plano?: string | null
          id?: string
          max_dependentes?: number | null
          notificacoes_habilitadas?: boolean | null
          plano_ativo?: boolean | null
          pode_gerenciar_planos?: boolean | null
          pode_visualizar_tudo?: boolean | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_admin_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      vinculos_usuarios: {
        Row: {
          ativo: boolean | null
          data_vinculo: string | null
          tipo_vinculo: Database["public"]["Enums"]["tipo_vinculo"]
          usuario_id: string
          usuario_principal_id: string | null
        }
        Insert: {
          ativo?: boolean | null
          data_vinculo?: string | null
          tipo_vinculo: Database["public"]["Enums"]["tipo_vinculo"]
          usuario_id: string
          usuario_principal_id?: string | null
        }
        Update: {
          ativo?: boolean | null
          data_vinculo?: string | null
          tipo_vinculo?: Database["public"]["Enums"]["tipo_vinculo"]
          usuario_id?: string
          usuario_principal_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vinculos_usuarios_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vinculos_usuarios_usuario_principal_id_fkey"
            columns: ["usuario_principal_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_links: {
        Row: {
          data_envio_email: string | null
          deletado_em: string | null
          id: string
          link: string
          status: Database["public"]["Enums"]["tipo_link_status"] | null
          usuario_id: string
        }
        Insert: {
          data_envio_email?: string | null
          deletado_em?: string | null
          id?: string
          link: string
          status?: Database["public"]["Enums"]["tipo_link_status"] | null
          usuario_id: string
        }
        Update: {
          data_envio_email?: string | null
          deletado_em?: string | null
          id?: string
          link?: string
          status?: Database["public"]["Enums"]["tipo_link_status"] | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_links_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_manage_dependents: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_dashboard_data: {
        Args: { user_id: string }
        Returns: {
          peso_atual: number
          ultimo_peso: number
          meta_peso: number
          meta_calorias: number
          meta_agua: number
          calorias_hoje: number
          agua_hoje: number
          registros_peso_30_dias: number
          registros_nutricao_30_dias: number
          registros_agua_30_dias: number
        }[]
      }
      get_user_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_usuarios: number
          total_clientes: number
          total_socios: number
          total_gestores: number
          total_dependentes: number
          usuarios_ativos_30_dias: number
        }[]
      }
      is_admin: {
        Args: { user_id?: string }
        Returns: boolean
      }
      is_current_user: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_socio: {
        Args: { user_id?: string }
        Returns: boolean
      }
      log_admin_action: {
        Args: {
          action_type: string
          target_user_id?: string
          target_email?: string
          action_details?: Json
        }
        Returns: undefined
      }
      make_user_admin: {
        Args: { user_email: string }
        Returns: undefined
      }
    }
    Enums: {
      tipo_ciclo_faturamento: "mensal" | "trimestral" | "semestral" | "anual"
      tipo_intensidade_exercicio: "leve" | "moderada" | "intensa"
      tipo_lembrete: "água" | "refeição" | "exercício" | "peso"
      tipo_link_status: "pendente" | "enviado" | "erro"
      tipo_liquido: "água" | "chá" | "café" | "suco" | "outro"
      tipo_nivel_dificuldade: "iniciante" | "intermediario" | "avancado"
      tipo_objetivo:
        | "perda_peso"
        | "ganho_massa"
        | "manutencao"
        | "melhorar_saude"
      tipo_status_assinatura: "ativa" | "cancelada" | "suspensa" | "expirada"
      tipo_status_envio: "pendente" | "enviado" | "falha"
      tipo_status_pagamento: "aprovado" | "pendente" | "falhou"
      tipo_usuario: "cliente" | "socio" | "gestor" | "dependente"
      tipo_vinculo:
        | "titular"
        | "dependente"
        | "profissional"
        | "gestor"
        | "socio"
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
      tipo_ciclo_faturamento: ["mensal", "trimestral", "semestral", "anual"],
      tipo_intensidade_exercicio: ["leve", "moderada", "intensa"],
      tipo_lembrete: ["água", "refeição", "exercício", "peso"],
      tipo_link_status: ["pendente", "enviado", "erro"],
      tipo_liquido: ["água", "chá", "café", "suco", "outro"],
      tipo_nivel_dificuldade: ["iniciante", "intermediario", "avancado"],
      tipo_objetivo: [
        "perda_peso",
        "ganho_massa",
        "manutencao",
        "melhorar_saude",
      ],
      tipo_status_assinatura: ["ativa", "cancelada", "suspensa", "expirada"],
      tipo_status_envio: ["pendente", "enviado", "falha"],
      tipo_status_pagamento: ["aprovado", "pendente", "falhou"],
      tipo_usuario: ["cliente", "socio", "gestor", "dependente"],
      tipo_vinculo: [
        "titular",
        "dependente",
        "profissional",
        "gestor",
        "socio",
      ],
    },
  },
} as const
