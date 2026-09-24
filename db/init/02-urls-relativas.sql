-- El dump viene de un entorno local con imagen_url = http://localhost:3000/uploads/...
-- En el VPS las imágenes se sirven desde /uploads del mismo dominio.
UPDATE public.productos
SET imagen_url = '/uploads/' || archivo_imagen
WHERE archivo_imagen IS NOT NULL;
