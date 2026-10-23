import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:traveltac_mobile/main.dart';

void main() {
  test('proximity filter returns POIs within radius ordered by distance', () {
    const near = Poi(
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

  testWidgets('home opens the explore tab and filters sample POIs', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(const TravelTacApp());

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
  });

  testWidgets('a POI opens its detail page', (WidgetTester tester) async {
    await tester.pumpWidget(const TravelTacApp());

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
    await tester.pumpWidget(const TravelTacApp());

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
    await tester.pumpWidget(const TravelTacApp());

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
}
