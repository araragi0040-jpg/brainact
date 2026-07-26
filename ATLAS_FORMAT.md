# v021 メッシュ／アトラス形式

## mesh

```json
{"vertices":[[x,y,z,{"parcelId":"L_V1","modelRegionId":"V1","hemisphere":"left","lobe":"後頭葉"}]],"faces":[[0,1,2]]}
```

## atlas

parcelには `id`, `modelRegionId`, `hemisphere`, `name`, `centroid` を持たせます。実際のGIFTI/NIfTIは将来の変換レイヤーでこのJSONへ変換します。
