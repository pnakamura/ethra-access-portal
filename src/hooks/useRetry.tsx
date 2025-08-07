import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseRetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  onError?: (error: Error, retryCount: number) => void;
}

export function useRetry<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options: UseRetryOptions = {}
) {
  const { maxRetries = 3, retryDelay = 1000, onError } = options;
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();

  const executeWithRetry = useCallback(
    async (...args: T): Promise<R> => {
      let currentRetry = 0;
      
      while (currentRetry <= maxRetries) {
        try {
          setIsRetrying(currentRetry > 0);
          setRetryCount(currentRetry);
          
          const result = await fn(...args);
          
          if (currentRetry > 0) {
            toast({
              title: "Operação bem-sucedida",
              description: `Sucesso após ${currentRetry} tentativa(s).`,
              variant: "default",
            });
          }
          
          setIsRetrying(false);
          setRetryCount(0);
          return result;
        } catch (error) {
          const err = error as Error;
          
          if (currentRetry === maxRetries) {
            setIsRetrying(false);
            setRetryCount(0);
            onError?.(err, currentRetry);
            throw err;
          }
          
          currentRetry++;
          
          if (currentRetry <= maxRetries) {
            toast({
              title: `Tentativa ${currentRetry} de ${maxRetries}`,
              description: "Tentando novamente...",
              variant: "default",
            });
            
            await new Promise(resolve => setTimeout(resolve, retryDelay * currentRetry));
          }
        }
      }
      
      throw new Error('Max retries exceeded');
    },
    [fn, maxRetries, retryDelay, onError, toast]
  );

  return {
    executeWithRetry,
    isRetrying,
    retryCount,
  };
}