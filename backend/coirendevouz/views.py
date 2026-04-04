"""Proje kökü (/) için minimal karşılama — API yalnızca /api/v1/ altında."""

from django.http import HttpResponse


def root(request):
    return HttpResponse(
        """<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Coirendevouz API</title>
</head>
<body>
  <h1>Coirendevouz</h1>
  <p>REST API: <a href="/api/v1/businesses/">/api/v1/businesses/</a></p>
  <p>Yönetim: <a href="/admin/">/admin/</a></p>
</body>
</html>""",
        content_type="text/html; charset=utf-8",
    )
