import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserGoals {
  calorias_diarias: number | null;
  agua_diaria_ml: number | null;
  peso_objetivo: number | null;
}

const DEFAULT_GOALS: UserGoals = {
  calorias_diarias: 2000,
  agua_diaria_ml: 2000,
  peso_objetivo: null,
};

export function useUserGoals(userId: string) {
  const [goals, setGoals] = useState<UserGoals>(DEFAULT_GOALS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setGoals(DEFAULT_GOALS);
      setLoading(false);
      return;
    }

    const fetchUserGoals = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('metas_usuario')
          .select('calorias_diarias, agua_diaria_ml, peso_objetivo')
          .eq('usuario_id', userId)
          .maybeSingle();

        if (error) {
          console.warn('Metas do usuário não encontradas, usando padrões:', error.message);
          setGoals(DEFAULT_GOALS);
          return;
        }

        if (data) {
          setGoals({
            calorias_diarias: data.calorias_diarias || DEFAULT_GOALS.calorias_diarias,
            agua_diaria_ml: data.agua_diaria_ml || DEFAULT_GOALS.agua_diaria_ml,
            peso_objetivo: data.peso_objetivo || DEFAULT_GOALS.peso_objetivo,
          });
        } else {
          setGoals(DEFAULT_GOALS);
        }
      } catch (error) {
        console.warn('Erro ao buscar metas, usando padrões:', error);
        setGoals(DEFAULT_GOALS);
      } finally {
        setLoading(false);
      }
    };

    fetchUserGoals();
  }, [userId]);

  const getProteinGoal = (calories: number) => Math.round(calories * 0.3 / 4); // 30% of calories from protein
  const getCarbGoal = (calories: number) => Math.round(calories * 0.45 / 4); // 45% of calories from carbs
  const getFatGoal = (calories: number) => Math.round(calories * 0.25 / 9); // 25% of calories from fat

  return {
    goals,
    loading,
    getProteinGoal,
    getCarbGoal,
    getFatGoal,
  };
}