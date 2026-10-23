import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:traveltac_mobile/data/public_catalog_repository.dart';
import 'package:traveltac_mobile/main.dart';

const _testPois = [
  Poi(
    id: 'test-miculla',
    name: 'Complejo Arqueológico de Miculla',
    category: 'Arqueología',
    location: '(-17.9630, -70.0850)',
    description:
        'Un paisaje de petroglifos, caminos antiguos y formaciones naturales '
        'que conserva parte de la memoria de los pueblos del valle.',
    icon: Icons.account_balance_rounded,
    color: Color(0xFFA94F32),
    latitude: -17.963,
    longitude: -70.085,
  ),
  Poi(
    id: 'test-alianza',
    name: 'Monumento al Alto de la Alianza',
    category: 'Historia',
    location: '(-18.0110, -70.2530)',
    description: 'Un espacio histórico y conmemorativo en Tacna.',
    icon: Icons.history_edu_rounded,
    color: Color(0xFFC18A35),
    latitude: -18.011,
    longitude: -70.253,
  ),
  Poi(
    id: 'test-cathedral',
    name: 'Catedral de Tacna',
    category: 'Arquitectura',
    location: '(-18.0140, -70.2530)',
    description: 'Un hito arquitectónico en el centro histórico.',
    icon: Icons.church_rounded,
    color: Color(0xFF773A2B),
    latitude: -18.014,
    longitude: -70.253,
  ),
];

class _TestCatalogRepository implements CatalogRepository {
  @override
  Future<PublicCatalog> fetchCatalog() async => const PublicCatalog(
    categories: ['Arqueología', 'Historia', 'Arquitectura'],
    pois: _testPois,
  );
}

class _SinglePoiRepository implements CatalogRepository {
  @override
  Future<PublicCatalog> fetchCatalog() async => PublicCatalog(
    categories: const ['Cultura local'],
    pois: [
      Poi.fromSupabase(const {
        'id': 71,
        'nombre': 'Museo desde Supabase',
        'descripcion_corta': 'Una ficha servida desde el catálogo remoto.',
        'historia_completa': '',
        'latitud': -18.01,
        'longitud': -70.25,
      }, categoryName: 'Cultura local'),
    ],
  );
}

Widget _testApp({String? configurationError}) => TravelTacApp(
  catalogRepository: _TestCatalogRepository(),
  catalogConfigurationError: configurationError,
);

void main() {
  test('proximity filter returns POIs within radius ordered by distance', () {
    const near = Poi(
      id: 'near',
      name: 'Cercano',
      category: 'Historia',
      location: 'Tacna',
      description: '',
      icon: Icons.place,
      color: Colors.brown,
      latitude: -18.014,
      longitude: -70.253,
    );
    const far = Poi(
      id: 'far',
      name: 'Lejano',
      category: 'Historia',
      location: 'Pachía',
      description: '',
      icon: Icons.place,
      color: Colors.brown,
      latitude: -17.941,
      longitude: -70.112,
    );
    const originLatitude = -18.015;
    const originLongitude = -70.254;

    final sortedResults = filterPoisByProximity(
      const [far, near],
      latitude: originLatitude,
      longitude: originLongitude,
      radiusKm: 100,
    );

    expect(sortedResults, [near, far]);
    expect(
      filterPoisByProximity(
        const [far, near],
        latitude: originLatitude,
        longitude: originLongitude,
        radiusKm: 2,
      ),
      [near],
    );
    expect(
      distanceToPoiKm(
        near,
        latitude: originLatitude,
        longitude: originLongitude,
      ),
      lessThan(
        distanceToPoiKm(
          far,
          latitude: originLatitude,
          longitude: originLongitude,
        ),
      ),
    );
  });

  test('Supabase POI rows are mapped to searchable catalog entries', () {
    final poi = Poi.fromSupabase(const {
      'id': 42,
      'nombre': 'Atractivo remoto',
      'descripcion_corta': 'Descripción publicada.',
      'historia_completa': 'Historia completa.',
      'latitud': '-18.01',
      'longitud': '-70.25',
    }, categoryName: 'Historia');

    expect(poi.id, '42');
    expect(poi.name, 'Atractivo remoto');
    expect(poi.category, 'Historia');
    expect(poi.description, 'Descripción publicada.');
    expect(poi.latitude, -18.01);
    expect(poi.longitude, -70.25);
  });

  testWidgets('Explore uses the catalog supplied by its repository', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      TravelTacApp(catalogRepository: _SinglePoiRepository()),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('Explorar').last);
    await tester.pumpAndSettle();

    expect(find.text('1 atractivo'), findsOneWidget);
    expect(find.text('Museo desde Supabase'), findsOneWidget);
    expect(find.text('Cultura local'), findsOneWidget);
    expect(find.text('Complejo Arqueológico de Miculla'), findsNothing);
  });

  testWidgets('home opens the explore tab and filters sample POIs', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(_testApp());
    await tester.pumpAndSettle();

    expect(find.text('Descubre Tacna'), findsOneWidget);
    expect(find.text('Un lugar para empezar'), findsOneWidget);

    await tester.tap(find.text('Explorar').last);
    await tester.pumpAndSettle();

    expect(find.text('Explorar Tacna'), findsOneWidget);
    expect(find.byKey(const Key('explore-search')), findsOneWidget);
    expect(find.text('3 atractivos'), findsOneWidget);

    await tester.enterText(find.byKey(const Key('explore-search')), 'Miculla');
    await tester.pumpAndSettle();

    expect(find.text('1 atractivo'), findsOneWidget);
    expect(find.text('Complejo Arqueológico de Miculla'), findsOneWidget);
    expect(find.text('Monumento al Alto de la Alianza'), findsNothing);

    await tester.enterText(find.byKey(const Key('explore-search')), '');
    await tester.pumpAndSettle();
    await tester.tap(find.text('Historia').first);
    await tester.pumpAndSettle();

    expect(find.text('1 atractivo'), findsOneWidget);
    expect(find.text('Monumento al Alto de la Alianza'), findsOneWidget);
    expect(find.text('Complejo Arqueológico de Miculla'), findsNothing);
  });

  testWidgets('a POI opens its detail page', (WidgetTester tester) async {
    await tester.pumpWidget(_testApp());
    await tester.pumpAndSettle();

    final featuredPoi = find.text('Complejo Arqueológico de Miculla').first;
    await tester.ensureVisible(featuredPoi);
    await tester.pumpAndSettle();
    await tester.tap(featuredPoi);
    await tester.pumpAndSettle();

    expect(find.text('Sobre este lugar'), findsOneWidget);
    expect(
      find.text(
        'Un paisaje de petroglifos, caminos antiguos y '
        'formaciones naturales que conserva parte de la memoria de los pueblos '
        'del valle.',
      ),
      findsOneWidget,
    );
  });

  testWidgets('map markers and offline downloads open the expected sections', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(_testApp());
    await tester.pumpAndSettle();

    await tester.tap(find.text('Mapa').last);
    await tester.pumpAndSettle();
    expect(find.text('Mapa de Tacna'), findsOneWidget);
    expect(find.text('GPS no conectado'), findsOneWidget);

    final mapPin = find.byKey(
      const ValueKey('map-pin-Complejo Arqueológico de Miculla'),
    );
    await tester.tap(mapPin);
    await tester.pumpAndSettle();
    expect(find.text('Sobre este lugar'), findsOneWidget);
    await tester.pageBack();
    await tester.pumpAndSettle();

    await tester.tap(find.text('Offline').last);
    await tester.pumpAndSettle();
    final downloadButton = find.byKey(
      const ValueKey('download-Complejo Arqueológico de Miculla'),
    );
    await tester.ensureVisible(downloadButton);
    await tester.pumpAndSettle();
    await tester.tap(downloadButton);
    await tester.pumpAndSettle();

    await tester.drag(find.byType(CustomScrollView).last, const Offset(0, 800));
    await tester.pumpAndSettle();
    expect(find.text('Paquetes en este dispositivo (1)'), findsOneWidget);
  });

  testWidgets('a POI review can be previewed locally', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(_testApp());
    await tester.pumpAndSettle();

    final featuredPoi = find.text('Complejo Arqueológico de Miculla').first;
    await tester.ensureVisible(featuredPoi);
    await tester.pumpAndSettle();
    await tester.tap(featuredPoi);
    await tester.pumpAndSettle();

    final commentField = find.byKey(const Key('review-comment'));
    await tester.scrollUntilVisible(
      commentField,
      300,
      scrollable: find.byType(Scrollable).last,
    );
    await tester.enterText(commentField, 'Un sitio muy interesante.');
    await tester.ensureVisible(find.text('Enviar reseña de prueba'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Enviar reseña de prueba'));
    await tester.pumpAndSettle();

    expect(find.text('5/5 · Un sitio muy interesante.'), findsOneWidget);
  });

  testWidgets('Explore reports catalog configuration failures', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      TravelTacApp(
        catalogConfigurationError:
            'Configura SUPABASE_URL y SUPABASE_ANON_KEY.',
      ),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('Explorar').last);
    await tester.pumpAndSettle();

    expect(find.byKey(const Key('catalog-error')), findsOneWidget);
    expect(
      find.text('Configura SUPABASE_URL y SUPABASE_ANON_KEY.'),
      findsOneWidget,
    );
    expect(find.text('Complejo Arqueológico de Miculla'), findsNothing);
  });
}
