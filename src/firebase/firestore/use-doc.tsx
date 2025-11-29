'use client';
import { useEffect, useState, useRef } from 'react';
import {
  onSnapshot,
  getDoc,
  type DocumentReference,
  type DocumentData,
  type DocumentSnapshot,
} from 'firebase/firestore';

type Options = {
  listen: boolean;
};

const defaultOptions: Options = {
  listen: true,
};

export function useDoc<T>(
  ref: DocumentReference | null,
  options: Options = defaultOptions
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const optionsRef = useRef(options);

  useEffect(() => {
    if (!ref) {
      setLoading(false);
      return;
    }

    if (optionsRef.current.listen) {
      const unsubscribe = onSnapshot(
        ref,
        (snapshot: DocumentSnapshot<DocumentData>) => {
          if (snapshot.exists()) {
            setData({ id: snapshot.id, ...snapshot.data() } as T);
          } else {
            setData(null);
          }
          setLoading(false);
        },
        (err) => {
          console.error(err);
          setError(err);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } else {
      setLoading(true);
      getDoc(ref)
        .then((snapshot) => {
          if (snapshot.exists()) {
            setData({ id: snapshot.id, ...snapshot.data() } as T);
          } else {
            setData(null);
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setError(err);
          setLoading(false);
        });
    }
  }, [ref]);

  return { data, loading, error };
}
