import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:geolocator/geolocator.dart';

void main() {
  runApp(const TravelTacApp());
}

const _sand = Color(0xFFEEE0C2);
const _sandLight = Color(0xFFFBF5E7);
const _clay = Color(0xFFA94F32);
const _clayDark = Color(0xFF773A2B);
const _ochre = Color(0xFFC18A35);
const _charcoal = Color(0xFF38291F);
const _muted = Color(0xFF786858);
const _line = Color(0xFFD9C8A7);

class TravelTacApp extends StatelessWidget {
  const TravelTacApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'TravelTac',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        scaffoldBackgroundColor: _sandLight,
        colorScheme: ColorScheme.fromSeed(
          seedColor: _clay,
          primary: _clay,
          secondary: _ochre,
          surface: _sandLight,
          onSurface: _charcoal,
        ),
        fontFamily: 'Trebuchet MS',
        textTheme: const TextTheme(
          headlineLarge: TextStyle(
            color: _charcoal,
            fontSize: 30,
            fontWeight: FontWeight.w800,
            height: 1.1,
          ),
          headlineMedium: TextStyle(
            color: _charcoal,
            fontSize: 23,
            fontWeight: FontWeight.w800,
          ),
          titleLarge: TextStyle(
            color: _charcoal,
            fontSize: 18,
            fontWeight: FontWeight.w700,
          ),
          bodyMedium: TextStyle(color: _muted, height: 1.45),
        ),
      ),
      home: const TravelTacHome(),
    );
  }
}

class Poi {
  const Poi({
    required this.name,
    required this.category,
    required this.location,
    required this.description,
    required this.icon,
    required this.color,
    required this.latitude,
    required this.longitude,
    this.featured = false,
  });

  final String name;
  final String category;
  final String location;
  final String description;
  final IconData icon;
  final Color color;
  final double latitude;
  final double longitude;
  final bool featured;
}

const _pois = [
  Poi(
    name: 'Complejo Arqueológico de Miculla',
    category: 'Arqueología',
    location: 'Pachía · 22 km de Tacna',
    description:
        'Un paisaje de petroglifos, caminos antiguos y formaciones naturales '
        'que conserva parte de la memoria de los pueblos del valle.',
    icon: Icons.landscape_rounded,
    color: _clay,
    latitude: -17.941,
    longitude: -70.112,
    featured: true,
  ),
  Poi(
    name: 'Monumento al Alto de la Alianza',
    category: 'Historia',
    location: 'Ciudad de Tacna',
    description:
        'Un espacio de memoria dedicado a quienes participaron en la batalla '
        'del Campo de la Alianza.',
    icon: Icons.account_balance_rounded,
    color: _ochre,
    latitude: -18.027,
    longitude: -70.252,
  ),
  Poi(
    name: 'Catedral de Tacna',
    category: 'Arquitectura',
    location: 'Centro histórico · Tacna',
    description:
        'Un hito arquitectónico de la ciudad, situado frente a la plaza '
        'principal de Tacna.',
    icon: Icons.church_rounded,
    color: _clayDark,
    latitude: -18.014,
    longitude: -70.253,
  ),
];

const _categories = ['Todos', 'Arqueología', 'Historia', 'Arquitectura'];

List<Poi> filterPoisByProximity(
  Iterable<Poi> pois, {
  required double latitude,
  required double longitude,
  required double radiusKm,
}) {
  final nearby = pois.where((poi) {
    return distanceToPoiKm(poi, latitude: latitude, longitude: longitude) <=
        radiusKm;
  }).toList();
  nearby.sort(
    (first, second) =>
        distanceToPoiKm(
          first,
          latitude: latitude,
          longitude: longitude,
        ).compareTo(
          distanceToPoiKm(second, latitude: latitude, longitude: longitude),
        ),
  );
  return nearby;
}

double distanceToPoiKm(
  Poi poi, {
  required double latitude,
  required double longitude,
}) =>
    Geolocator.distanceBetween(
      latitude,
      longitude,
      poi.latitude,
      poi.longitude,
    ) /
    1000;

class TravelTacHome extends StatefulWidget {
  const TravelTacHome({super.key});

  @override
  State<TravelTacHome> createState() => _TravelTacHomeState();
}

class _TravelTacHomeState extends State<TravelTacHome> {
  int _tabIndex = 0;
  String _query = '';
  String _category = 'Todos';
  final Set<String> _downloadedPois = {};
  final _exploreController = TextEditingController();

  @override
  void dispose() {
    _exploreController.dispose();
    super.dispose();
  }

  void _openExplore({String? query, String? category}) {
    setState(() {
      _tabIndex = 1;
      if (query != null) {
        _query = query;
        _exploreController.text = query;
      }
      if (category != null) _category = category;
    });
  }

  void _openPoi(Poi poi) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (context) => PoiDetailPage(
          poi: poi,
          isDownloaded: _downloadedPois.contains(poi.name),
          onDownload: () {
            setState(() => _downloadedPois.add(poi.name));
          },
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      HomePage(
        onSearch: (query) => _openExplore(query: query),
        onExplore: () => _openExplore(),
        onMap: () => setState(() => _tabIndex = 2),
        onCategory: (category) => _openExplore(category: category),
        onPoiTap: _openPoi,
      ),
      ExplorePage(
        query: _query,
        category: _category,
        controller: _exploreController,
        onQueryChanged: (query) => setState(() => _query = query),
        onCategoryChanged: (category) => setState(() => _category = category),
        onPoiTap: _openPoi,
      ),
      MapPage(onPoiTap: _openPoi),
      DownloadsPage(
        downloadedPois: _pois
            .where((poi) => _downloadedPois.contains(poi.name))
            .toList(),
        onDownload: (poi) => setState(() => _downloadedPois.add(poi.name)),
        onPoiTap: _openPoi,
      ),
      const PreferencesPage(),
    ];

    return Scaffold(
      body: SafeArea(
        child: IndexedStack(index: _tabIndex, children: pages),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tabIndex,
        onDestinationSelected: (index) => setState(() => _tabIndex = index),
        backgroundColor: _sandLight,
        indicatorColor: _sand,
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home_rounded),
            label: 'Inicio',
          ),
          NavigationDestination(
            icon: Icon(Icons.explore_outlined),
            selectedIcon: Icon(Icons.explore_rounded),
            label: 'Explorar',
          ),
          NavigationDestination(
            icon: Icon(Icons.map_outlined),
            selectedIcon: Icon(Icons.map_rounded),
            label: 'Mapa',
          ),
          NavigationDestination(
            icon: Icon(Icons.download_outlined),
            selectedIcon: Icon(Icons.download_rounded),
            label: 'Offline',
          ),
          NavigationDestination(
            icon: Icon(Icons.tune_rounded),
            selectedIcon: Icon(Icons.tune_rounded),
            label: 'Ajustes',
          ),
        ],
      ),
    );
  }
}

class HomePage extends StatelessWidget {
  const HomePage({
    required this.onSearch,
    required this.onExplore,
    required this.onMap,
    required this.onCategory,
    required this.onPoiTap,
    super.key,
  });

  final ValueChanged<String> onSearch;
  final VoidCallback onExplore;
  final VoidCallback onMap;
  final ValueChanged<String> onCategory;
  final ValueChanged<Poi> onPoiTap;

  @override
  Widget build(BuildContext context) {
    final featured = _pois.first;
    return CustomScrollView(
      slivers: [
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(22, 18, 22, 28),
          sliver: SliverList(
            delegate: SliverChildListDelegate([
              Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: _clay,
                      borderRadius: BorderRadius.circular(15),
                    ),
                    child: const Icon(
                      Icons.explore_rounded,
                      color: _sandLight,
                      size: 26,
                    ),
                  ),
                  const SizedBox(width: 11),
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'TRAVELTAC',
                        style: TextStyle(
                          color: _clayDark,
                          fontSize: 15,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1.7,
                        ),
                      ),
                      Text(
                        'Tu guía de Tacna',
                        style: TextStyle(color: _muted, fontSize: 12),
                      ),
                    ],
                  ),
                  const Spacer(),
                  IconButton(
                    tooltip: 'Explorar atractivos',
                    onPressed: onMap,
                    icon: const Icon(Icons.map_outlined, color: _clayDark),
                  ),
                ],
              ),
              const SizedBox(height: 27),
              Text('HOLA, VIAJERO', style: _eyebrowStyle),
              const SizedBox(height: 7),
              Text(
                'Descubre Tacna',
                style: Theme.of(context).textTheme.headlineLarge,
              ),
              const SizedBox(height: 7),
              const Text(
                'Historias, paisajes y cultura en cada camino.',
                style: TextStyle(color: _muted, fontSize: 15),
              ),
              const SizedBox(height: 21),
              _HomeSearchField(onSubmit: onSearch),
              const SizedBox(height: 27),
              _SectionHeading(
                title: 'Explora por categoría',
                action: 'Ver todo',
                onAction: onExplore,
              ),
              const SizedBox(height: 13),
              SizedBox(
                height: 43,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: _categories.length - 1,
                  separatorBuilder: (_, _) => const SizedBox(width: 9),
                  itemBuilder: (context, index) {
                    final category = _categories[index + 1];
                    return ActionChip(
                      onPressed: () => onCategory(category),
                      avatar: Icon(
                        _categoryIcon(category),
                        size: 17,
                        color: _clayDark,
                      ),
                      label: Text(category),
                      backgroundColor: Colors.white,
                      side: const BorderSide(color: _line),
                      labelStyle: const TextStyle(
                        color: _charcoal,
                        fontWeight: FontWeight.w600,
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                    );
                  },
                ),
              ),
              const SizedBox(height: 27),
              _SectionHeading(
                title: 'Un lugar para empezar',
                action: 'Ver atractivos',
                onAction: onExplore,
              ),
              const SizedBox(height: 13),
              _FeaturedPoiCard(poi: featured, onTap: () => onPoiTap(featured)),
              const SizedBox(height: 26),
              _SectionHeading(
                title: 'También puedes visitar',
                action: 'Explorar',
                onAction: onExplore,
              ),
              const SizedBox(height: 11),
              ..._pois
                  .skip(1)
                  .map(
                    (poi) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: _PoiListTile(poi: poi, onTap: () => onPoiTap(poi)),
                    ),
                  ),
              const SizedBox(height: 6),
              const Text(
                'Contenido de muestra · Próximamente conectado al catálogo turístico.',
                textAlign: TextAlign.center,
                style: TextStyle(color: _muted, fontSize: 11),
              ),
            ]),
          ),
        ),
      ],
    );
  }
}

class _HomeSearchField extends StatefulWidget {
  const _HomeSearchField({required this.onSubmit});

  final ValueChanged<String> onSubmit;

  @override
  State<_HomeSearchField> createState() => _HomeSearchFieldState();
}

class _HomeSearchFieldState extends State<_HomeSearchField> {
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: _controller,
      textInputAction: TextInputAction.search,
      onSubmitted: (value) => widget.onSubmit(value.trim()),
      decoration: InputDecoration(
        hintText: '¿Qué quieres descubrir?',
        hintStyle: const TextStyle(color: _muted),
        prefixIcon: const Icon(Icons.search_rounded, color: _clay),
        suffixIcon: IconButton(
          tooltip: 'Buscar',
          onPressed: () => widget.onSubmit(_controller.text.trim()),
          icon: const Icon(Icons.arrow_forward_rounded, color: _clay),
        ),
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(vertical: 15),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(17),
          borderSide: const BorderSide(color: _line),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(17),
          borderSide: const BorderSide(color: _line),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(17),
          borderSide: const BorderSide(color: _clay, width: 1.5),
        ),
      ),
    );
  }
}

class _SectionHeading extends StatelessWidget {
  const _SectionHeading({
    required this.title,
    required this.action,
    required this.onAction,
  });

  final String title;
  final String action;
  final VoidCallback onAction;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(title, style: Theme.of(context).textTheme.titleLarge),
        ),
        TextButton(
          onPressed: onAction,
          style: TextButton.styleFrom(
            foregroundColor: _clay,
            padding: const EdgeInsets.symmetric(horizontal: 5),
          ),
          child: Text(action),
        ),
      ],
    );
  }
}

class _FeaturedPoiCard extends StatelessWidget {
  const _FeaturedPoiCard({required this.poi, required this.onTap});

  final Poi poi;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: _clayDark,
      borderRadius: BorderRadius.circular(23),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: SizedBox(
          height: 212,
          child: Stack(
            children: [
              Positioned(
                right: -18,
                top: -26,
                child: Icon(
                  Icons.landscape_rounded,
                  size: 190,
                  color: Colors.white.withValues(alpha: 0.09),
                ),
              ),
              Positioned(
                right: 25,
                top: 31,
                child: Icon(
                  Icons.wb_sunny_rounded,
                  size: 42,
                  color: _sand.withValues(alpha: 0.82),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: _sand.withValues(alpha: 0.18),
                        borderRadius: BorderRadius.circular(30),
                      ),
                      child: const Text(
                        'DESTACADO',
                        style: TextStyle(
                          color: _sandLight,
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1.1,
                        ),
                      ),
                    ),
                    const Spacer(),
                    Text(
                      poi.name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        height: 1.15,
                      ),
                    ),
                    const SizedBox(height: 7),
                    Row(
                      children: [
                        const Icon(
                          Icons.place_outlined,
                          size: 16,
                          color: _sand,
                        ),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            poi.location,
                            style: const TextStyle(color: _sand, fontSize: 12),
                          ),
                        ),
                        const Icon(
                          Icons.arrow_forward_rounded,
                          color: Colors.white,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class ExplorePage extends StatefulWidget {
  const ExplorePage({
    required this.query,
    required this.category,
    required this.controller,
    required this.onQueryChanged,
    required this.onCategoryChanged,
    required this.onPoiTap,
    super.key,
  });

  final String query;
  final String category;
  final TextEditingController controller;
  final ValueChanged<String> onQueryChanged;
  final ValueChanged<String> onCategoryChanged;
  final ValueChanged<Poi> onPoiTap;

  @override
  State<ExplorePage> createState() => _ExplorePageState();
}

class _ExplorePageState extends State<ExplorePage> {
  Position? _currentPosition;
  bool _isLoadingLocation = false;
  bool _nearbyEnabled = false;
  double _radiusKm = 25;
  String? _locationError;

  Future<void> _enableNearby() async {
    setState(() {
      _isLoadingLocation = true;
      _locationError = null;
    });

    try {
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!mounted) return;
      if (!serviceEnabled) {
        setState(() {
          _locationError =
              'Activa los servicios de ubicación para buscar por cercanía.';
        });
        return;
      }

      var permission = await Geolocator.checkPermission();
      if (!mounted) return;
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (!mounted) return;
      }
      if (permission == LocationPermission.denied) {
        setState(() {
          _locationError =
              'Se denegó el permiso de ubicación. Puedes buscar por nombre '
              'o categoría sin compartir tu ubicación.';
        });
        return;
      }
      if (permission == LocationPermission.deniedForever) {
        setState(() {
          _locationError =
              'El permiso está bloqueado. Actívalo en la configuración del dispositivo.';
        });
        return;
      }
      if (permission != LocationPermission.whileInUse &&
          permission != LocationPermission.always) {
        setState(() {
          _locationError =
              'No se pudo confirmar el permiso de ubicación del dispositivo.';
        });
        return;
      }

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.medium,
          timeLimit: Duration(seconds: 20),
        ),
      );
      if (!mounted) return;
      setState(() {
        _currentPosition = position;
        _nearbyEnabled = true;
      });
    } on TimeoutException {
      if (!mounted) return;
      setState(() {
        _locationError =
            'No se obtuvo la ubicación a tiempo. Comprueba la señal GPS e inténtalo nuevamente.';
      });
    } on PlatformException catch (error) {
      if (!mounted) return;
      setState(() {
        _locationError =
            'No se pudo obtener la ubicación: ${error.message ?? error.code}';
      });
    } finally {
      if (mounted) setState(() => _isLoadingLocation = false);
    }
  }

  void _disableNearby() {
    setState(() {
      _nearbyEnabled = false;
      _locationError = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    final normalizedQuery = widget.query.trim().toLowerCase();
    final matchingPois = _pois.where((poi) {
      final matchesQuery =
          normalizedQuery.isEmpty ||
          poi.name.toLowerCase().contains(normalizedQuery) ||
          poi.location.toLowerCase().contains(normalizedQuery);
      final matchesCategory =
          widget.category == 'Todos' || poi.category == widget.category;
      return matchesQuery && matchesCategory;
    }).toList();
    final results = _nearbyEnabled && _currentPosition != null
        ? filterPoisByProximity(
            matchingPois,
            latitude: _currentPosition!.latitude,
            longitude: _currentPosition!.longitude,
            radiusKm: _radiusKm,
          )
        : matchingPois;

    return CustomScrollView(
      slivers: [
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(22, 28, 22, 24),
          sliver: SliverList(
            delegate: SliverChildListDelegate([
              Text('DESCUBRE A TU RITMO', style: _eyebrowStyle),
              const SizedBox(height: 7),
              Text(
                'Explorar Tacna',
                style: Theme.of(context).textTheme.headlineLarge,
              ),
              const SizedBox(height: 18),
              TextField(
                key: const Key('explore-search'),
                controller: widget.controller,
                onChanged: widget.onQueryChanged,
                textInputAction: TextInputAction.search,
                decoration: InputDecoration(
                  hintText: 'Busca un atractivo',
                  prefixIcon: const Icon(Icons.search_rounded, color: _clay),
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: const BorderSide(color: _line),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: const BorderSide(color: _line),
                  ),
                ),
              ),
              const SizedBox(height: 13),
              SizedBox(
                height: 42,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: _categories.length,
                  separatorBuilder: (_, _) => const SizedBox(width: 8),
                  itemBuilder: (context, index) {
                    final item = _categories[index];
                    return ChoiceChip(
                      label: Text(item),
                      selected: widget.category == item,
                      onSelected: (_) => widget.onCategoryChanged(item),
                      selectedColor: _clay,
                      backgroundColor: Colors.white,
                      side: BorderSide(
                        color: widget.category == item ? _clay : _line,
                      ),
                      labelStyle: TextStyle(
                        color: widget.category == item
                            ? Colors.white
                            : _charcoal,
                        fontWeight: FontWeight.w600,
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 10),
              OutlinedButton.icon(
                key: const Key('nearby-filter'),
                onPressed: _isLoadingLocation
                    ? null
                    : _nearbyEnabled
                    ? _disableNearby
                    : _enableNearby,
                icon: _isLoadingLocation
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Icon(
                        _nearbyEnabled
                            ? Icons.location_off_outlined
                            : Icons.near_me_outlined,
                      ),
                label: Text(
                  _isLoadingLocation
                      ? 'Obteniendo ubicación…'
                      : _nearbyEnabled
                      ? 'Quitar filtro de cercanía'
                      : 'Buscar cerca de mí',
                ),
              ),
              if (_locationError != null) ...[
                const SizedBox(height: 8),
                Container(
                  key: const Key('location-error'),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFE8DF),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(
                        Icons.location_disabled_outlined,
                        color: _clayDark,
                        size: 19,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _locationError!,
                          style: const TextStyle(
                            color: _clayDark,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              if (_nearbyEnabled) ...[
                const SizedBox(height: 12),
                Text(
                  'Radio de búsqueda: ${_radiusKm.round()} km',
                  style: const TextStyle(
                    color: _charcoal,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Slider(
                  key: const Key('nearby-radius'),
                  value: _radiusKm,
                  min: 5,
                  max: 100,
                  divisions: 19,
                  label: '${_radiusKm.round()} km',
                  activeColor: _clay,
                  onChanged: (value) => setState(() => _radiusKm = value),
                ),
              ],
              const SizedBox(height: 16),
              Text(
                '${results.length} ${results.length == 1 ? 'atractivo' : 'atractivos'}',
                style: const TextStyle(
                  color: _muted,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 5),
              Text(
                _nearbyEnabled
                    ? 'Ordenados por distancia desde tu ubicación actual.'
                    : 'El filtro de cercanía solo solicita ubicación al activarlo.',
                style: const TextStyle(color: _muted, fontSize: 11),
              ),
              const SizedBox(height: 10),
              if (results.isEmpty)
                const _EmptyState(
                  icon: Icons.travel_explore_rounded,
                  title: 'No encontramos resultados',
                  message: 'Prueba otro nombre o cambia la categoría.',
                )
              else
                ...results.map(
                  (poi) => Padding(
                    padding: const EdgeInsets.only(bottom: 11),
                    child: _PoiListTile(
                      poi: poi,
                      onTap: () => widget.onPoiTap(poi),
                      distanceLabel: _nearbyEnabled
                          ? _formatDistance(_distanceTo(poi))
                          : null,
                    ),
                  ),
                ),
              const SizedBox(height: 6),
              const Text(
                'Contenido de muestra · Próximamente conectado al catálogo turístico.',
                textAlign: TextAlign.center,
                style: TextStyle(color: _muted, fontSize: 11),
              ),
            ]),
          ),
        ),
      ],
    );
  }

  double _distanceTo(Poi poi) => distanceToPoiKm(
    poi,
    latitude: _currentPosition!.latitude,
    longitude: _currentPosition!.longitude,
  );
}

class MapPage extends StatelessWidget {
  const MapPage({required this.onPoiTap, super.key});

  final ValueChanged<Poi> onPoiTap;

  @override
  Widget build(BuildContext context) {
    return CustomScrollView(
      slivers: [
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(22, 28, 22, 24),
          sliver: SliverList(
            delegate: SliverChildListDelegate([
              Text('ORIENTACIÓN', style: _eyebrowStyle),
              const SizedBox(height: 7),
              Text(
                'Mapa de Tacna',
                style: Theme.of(context).textTheme.headlineLarge,
              ),
              const SizedBox(height: 7),
              const Text(
                'Explora los atractivos y abre sus fichas desde el mapa.',
                style: TextStyle(color: _muted, fontSize: 14),
              ),
              const SizedBox(height: 17),
              _MapPreview(onPoiTap: onPoiTap),
              const SizedBox(height: 11),
              Container(
                padding: const EdgeInsets.all(13),
                decoration: BoxDecoration(
                  color: _sand,
                  borderRadius: BorderRadius.circular(15),
                ),
                child: const Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.my_location_rounded, color: _clayDark, size: 20),
                    SizedBox(width: 9),
                    Expanded(
                      child: Text(
                        'La ubicación GPS en tiempo real estará disponible al '
                        'configurar permisos y el servicio de mapas.',
                        style: TextStyle(
                          color: _clayDark,
                          fontSize: 12,
                          height: 1.4,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 21),
              Text(
                'Puntos de interés',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 11),
              ..._pois.map(
                (poi) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: _PoiListTile(poi: poi, onTap: () => onPoiTap(poi)),
                ),
              ),
              const _DemoDataNotice(),
            ]),
          ),
        ),
      ],
    );
  }
}

class _MapPreview extends StatelessWidget {
  const _MapPreview({required this.onPoiTap});

  final ValueChanged<Poi> onPoiTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 310,
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: const Color(0xFFE7DFC9),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: _line),
      ),
      child: Stack(
        children: [
          const Positioned.fill(child: CustomPaint(painter: _MapPainter())),
          Positioned(
            top: 12,
            left: 12,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.94),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Text(
                'VISTA ESQUEMÁTICA',
                style: TextStyle(
                  color: _clayDark,
                  fontSize: 9,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.8,
                ),
              ),
            ),
          ),
          Positioned(
            left: 22,
            top: 96,
            child: _MapPin(poi: _pois[0], onTap: () => onPoiTap(_pois[0])),
          ),
          Positioned(
            right: 25,
            top: 164,
            child: _MapPin(poi: _pois[1], onTap: () => onPoiTap(_pois[1])),
          ),
          Positioned(
            left: 150,
            bottom: 43,
            child: _MapPin(poi: _pois[2], onTap: () => onPoiTap(_pois[2])),
          ),
          const Positioned(
            right: 12,
            top: 12,
            child: Icon(Icons.layers_outlined, color: _clayDark),
          ),
          Positioned(
            right: 12,
            bottom: 12,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.92),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.circle, color: Colors.blueAccent, size: 9),
                  SizedBox(width: 5),
                  Text(
                    'GPS no conectado',
                    style: TextStyle(color: _muted, fontSize: 10),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MapPin extends StatelessWidget {
  const _MapPin({required this.poi, required this.onTap});

  final Poi poi;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: poi.name,
      child: InkWell(
        key: ValueKey('map-pin-${poi.name}'),
        onTap: onTap,
        borderRadius: BorderRadius.circular(30),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: poi.color,
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 2),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x33000000),
                    blurRadius: 8,
                    offset: Offset(0, 3),
                  ),
                ],
              ),
              child: const Icon(
                Icons.place_rounded,
                size: 19,
                color: Colors.white,
              ),
            ),
            Container(
              constraints: const BoxConstraints(maxWidth: 118),
              margin: const EdgeInsets.only(top: 3),
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.95),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                poi.name,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: _charcoal,
                  fontSize: 9,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MapPainter extends CustomPainter {
  const _MapPainter();

  @override
  void paint(Canvas canvas, Size size) {
    final parkPaint = Paint()..color = const Color(0xFFD2DDBB);
    final roadPaint = Paint()
      ..color = const Color(0xFFF8F3E7)
      ..strokeWidth = 13
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;
    final roadEdgePaint = Paint()
      ..color = const Color(0xFFD7CBB2)
      ..strokeWidth = 15
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(size.width * 0.08, size.height * 0.67, 82, 48),
        const Radius.circular(18),
      ),
      parkPaint,
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(size.width * 0.67, size.height * 0.12, 72, 48),
        const Radius.circular(18),
      ),
      parkPaint,
    );
    final roads = [
      Path()
        ..moveTo(-20, size.height * 0.35)
        ..cubicTo(
          size.width * 0.25,
          size.height * 0.2,
          size.width * 0.58,
          size.height * 0.53,
          size.width + 20,
          size.height * 0.38,
        ),
      Path()
        ..moveTo(size.width * 0.42, -10)
        ..cubicTo(
          size.width * 0.28,
          size.height * 0.35,
          size.width * 0.74,
          size.height * 0.66,
          size.width * 0.58,
          size.height + 10,
        ),
      Path()
        ..moveTo(-10, size.height * 0.81)
        ..cubicTo(
          size.width * 0.31,
          size.height * 0.65,
          size.width * 0.68,
          size.height * 0.93,
          size.width + 10,
          size.height * 0.73,
        ),
    ];
    for (final road in roads) {
      canvas.drawPath(road, roadEdgePaint);
      canvas.drawPath(road, roadPaint);
    }
  }

  @override
  bool shouldRepaint(covariant _MapPainter oldDelegate) => false;
}

class DownloadsPage extends StatelessWidget {
  const DownloadsPage({
    required this.downloadedPois,
    required this.onDownload,
    required this.onPoiTap,
    super.key,
  });

  final List<Poi> downloadedPois;
  final ValueChanged<Poi> onDownload;
  final ValueChanged<Poi> onPoiTap;

  @override
  Widget build(BuildContext context) {
    return CustomScrollView(
      slivers: [
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(22, 28, 22, 24),
          sliver: SliverList(
            delegate: SliverChildListDelegate([
              Text('SIN CONEXIÓN', style: _eyebrowStyle),
              const SizedBox(height: 7),
              Text(
                'Contenido offline',
                style: Theme.of(context).textTheme.headlineLarge,
              ),
              const SizedBox(height: 8),
              const Text(
                'Prepara información y recursos para consultarlos durante tu visita.',
                style: TextStyle(color: _muted, fontSize: 14),
              ),
              const SizedBox(height: 16),
              const _DemoDataNotice(
                message:
                    'La descarga real de archivos y el almacenamiento local '
                    'se conectarán al gestor de caché y a SQLite.',
              ),
              const SizedBox(height: 20),
              Text(
                'Paquetes en este dispositivo (${downloadedPois.length})',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 11),
              if (downloadedPois.isEmpty)
                const _EmptyState(
                  icon: Icons.cloud_download_outlined,
                  title: 'Aún no hay paquetes offline',
                  message:
                      'Puedes probar el flujo con un atractivo de muestra.',
                )
              else
                ...downloadedPois.map(
                  (poi) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: _PoiListTile(poi: poi, onTap: () => onPoiTap(poi)),
                  ),
                ),
              const SizedBox(height: 22),
              Text(
                'Explora atractivos',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 11),
              ..._pois.map((poi) {
                final isDownloaded = downloadedPois.any(
                  (item) => item.name == poi.name,
                );
                return Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: _DownloadPoiTile(
                    poi: poi,
                    isDownloaded: isDownloaded,
                    onDownload: () => onDownload(poi),
                    onTap: () => onPoiTap(poi),
                  ),
                );
              }),
            ]),
          ),
        ),
      ],
    );
  }
}

class _DownloadPoiTile extends StatelessWidget {
  const _DownloadPoiTile({
    required this.poi,
    required this.isDownloaded,
    required this.onDownload,
    required this.onTap,
  });

  final Poi poi;
  final bool isDownloaded;
  final VoidCallback onDownload;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(17),
        border: Border.all(color: _line),
      ),
      child: Row(
        children: [
          Expanded(
            child: _PoiListTile(poi: poi, onTap: onTap),
          ),
          const SizedBox(width: 6),
          IconButton.filledTonal(
            key: ValueKey('download-${poi.name}'),
            tooltip: isDownloaded ? 'Paquete preparado' : 'Simular descarga',
            onPressed: isDownloaded ? null : onDownload,
            icon: Icon(
              isDownloaded ? Icons.check_rounded : Icons.download_rounded,
            ),
          ),
        ],
      ),
    );
  }
}

class PreferencesPage extends StatefulWidget {
  const PreferencesPage({super.key});

  @override
  State<PreferencesPage> createState() => _PreferencesPageState();
}

class _PreferencesPageState extends State<PreferencesPage> {
  bool _proximityEnabled = false;
  double _geofenceRadius = 100;
  double _playbackSpeed = 1;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(22, 28, 22, 24),
      children: [
        Text('PERSONALIZA TU VISITA', style: _eyebrowStyle),
        const SizedBox(height: 7),
        Text('Ajustes', style: Theme.of(context).textTheme.headlineLarge),
        const SizedBox(height: 8),
        const Text(
          'Preferencias de accesibilidad, audio y proximidad.',
          style: TextStyle(color: _muted, fontSize: 14),
        ),
        const SizedBox(height: 20),
        _SettingsSection(
          title: 'Proximidad',
          icon: Icons.radar_rounded,
          children: [
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Avisar cerca de un atractivo'),
              subtitle: const Text(
                'La detección GPS y las notificaciones aún no están conectadas.',
              ),
              value: _proximityEnabled,
              activeThumbColor: _clay,
              onChanged: (value) => setState(() => _proximityEnabled = value),
            ),
            Text('Radio de aviso: ${_geofenceRadius.round()} m'),
            Slider(
              value: _geofenceRadius,
              min: 50,
              max: 500,
              divisions: 9,
              activeColor: _clay,
              onChanged: _proximityEnabled
                  ? (value) => setState(() => _geofenceRadius = value)
                  : null,
            ),
          ],
        ),
        const SizedBox(height: 13),
        _SettingsSection(
          title: 'Audioguía',
          icon: Icons.headphones_rounded,
          children: [
            const Text(
              'Ajuste de velocidad para cuando el reproductor esté disponible.',
            ),
            const SizedBox(height: 8),
            DropdownButtonFormField<double>(
              initialValue: _playbackSpeed,
              decoration: const InputDecoration(
                labelText: 'Velocidad de reproducción',
                border: OutlineInputBorder(),
              ),
              items: const [
                DropdownMenuItem(value: 0.75, child: Text('0.75×')),
                DropdownMenuItem(value: 1, child: Text('1.0×')),
                DropdownMenuItem(value: 1.25, child: Text('1.25×')),
                DropdownMenuItem(value: 1.5, child: Text('1.5×')),
              ],
              onChanged: (value) {
                if (value != null) setState(() => _playbackSpeed = value);
              },
            ),
          ],
        ),
        const SizedBox(height: 14),
        const _DemoDataNotice(
          message:
              'Estos ajustes son temporales en esta demostración y todavía '
              'no se guardan al cerrar la app.',
        ),
      ],
    );
  }
}

class _SettingsSection extends StatelessWidget {
  const _SettingsSection({
    required this.title,
    required this.icon,
    required this.children,
  });

  final String title;
  final IconData icon;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: const BorderSide(color: _line),
      ),
      clipBehavior: Clip.antiAlias,
      child: Padding(
        padding: const EdgeInsets.all(15),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: _clay),
                const SizedBox(width: 9),
                Text(
                  title,
                  style: const TextStyle(
                    color: _charcoal,
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 9),
            ...children,
          ],
        ),
      ),
    );
  }
}

class _DemoDataNotice extends StatelessWidget {
  const _DemoDataNotice({
    this.message =
        'Contenido de demostración; el catálogo real aún no está conectado.',
  });

  final String message;

  @override
  Widget build(BuildContext context) {
    return Text(
      message,
      textAlign: TextAlign.center,
      style: const TextStyle(color: _muted, fontSize: 11, height: 1.4),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({
    required this.icon,
    required this.title,
    required this.message,
  });

  final IconData icon;
  final String title;
  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 34),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: _line),
      ),
      child: Column(
        children: [
          Icon(icon, size: 40, color: _ochre),
          const SizedBox(height: 12),
          Text(
            title,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: _charcoal,
              fontSize: 17,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 6),
          Text(message, textAlign: TextAlign.center),
        ],
      ),
    );
  }
}

class _PoiListTile extends StatelessWidget {
  const _PoiListTile({
    required this.poi,
    required this.onTap,
    this.distanceLabel,
  });

  final Poi poi;
  final VoidCallback onTap;
  final String? distanceLabel;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(17),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(17),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(17),
            border: Border.all(color: _line),
          ),
          child: Row(
            children: [
              Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  color: poi.color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(poi.icon, color: poi.color, size: 25),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      poi.category.toUpperCase(),
                      style: const TextStyle(
                        color: _clay,
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.8,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      poi.name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: _charcoal,
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      poi.location,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(color: _muted, fontSize: 11),
                    ),
                    if (distanceLabel != null) ...[
                      const SizedBox(height: 3),
                      Text(
                        distanceLabel!,
                        style: const TextStyle(
                          color: _clay,
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: 6),
              const Icon(Icons.chevron_right_rounded, color: _muted),
            ],
          ),
        ),
      ),
    );
  }
}

class PoiDetailPage extends StatefulWidget {
  const PoiDetailPage({
    required this.poi,
    required this.isDownloaded,
    required this.onDownload,
    super.key,
  });

  final Poi poi;
  final bool isDownloaded;
  final VoidCallback onDownload;

  @override
  State<PoiDetailPage> createState() => _PoiDetailPageState();
}

class _PoiDetailPageState extends State<PoiDetailPage> {
  late bool _isDownloaded;
  final _reviewController = TextEditingController();
  final List<String> _demoReviews = [];
  int _rating = 5;

  @override
  void initState() {
    super.initState();
    _isDownloaded = widget.isDownloaded;
  }

  @override
  void dispose() {
    _reviewController.dispose();
    super.dispose();
  }

  void _submitReview() {
    final comment = _reviewController.text.trim();
    if (comment.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Escribe un comentario antes de enviarlo.'),
        ),
      );
      return;
    }
    setState(() {
      _demoReviews.insert(0, '$_rating/5 · $comment');
      _reviewController.clear();
      _rating = 5;
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Reseña añadida solo a esta vista de demostración.'),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final poi = widget.poi;
    return Scaffold(
      appBar: AppBar(
        backgroundColor: _sandLight,
        title: const Text('Atractivo'),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(22, 8, 22, 28),
        children: [
          Container(
            height: 210,
            decoration: BoxDecoration(
              color: poi.color,
              borderRadius: BorderRadius.circular(24),
            ),
            child: Icon(
              poi.icon,
              size: 92,
              color: Colors.white.withValues(alpha: 0.9),
            ),
          ),
          const SizedBox(height: 20),
          Text(poi.category.toUpperCase(), style: _eyebrowStyle),
          const SizedBox(height: 7),
          Text(poi.name, style: Theme.of(context).textTheme.headlineMedium),
          const SizedBox(height: 11),
          Row(
            children: [
              const Icon(Icons.place_outlined, size: 18, color: _clay),
              const SizedBox(width: 5),
              Expanded(child: Text(poi.location)),
            ],
          ),
          const SizedBox(height: 20),
          const Text(
            'Sobre este lugar',
            style: TextStyle(
              color: _charcoal,
              fontSize: 18,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            poi.description,
            style: const TextStyle(color: _muted, fontSize: 15, height: 1.6),
          ),
          const SizedBox(height: 22),
          _SettingsSection(
            title: 'Audioguía',
            icon: Icons.headphones_rounded,
            children: [
              Row(
                children: [
                  IconButton.filledTonal(
                    onPressed: null,
                    tooltip: 'Reproductor pendiente de integración',
                    icon: const Icon(Icons.play_arrow_rounded),
                  ),
                  const SizedBox(width: 10),
                  const Expanded(
                    child: Text(
                      'No hay un archivo de audio conectado para este atractivo.',
                      style: TextStyle(color: _muted, fontSize: 12),
                    ),
                  ),
                ],
              ),
              const Row(
                children: [
                  Text('0:00', style: TextStyle(color: _muted, fontSize: 11)),
                  Expanded(child: Slider(value: 0, onChanged: null)),
                  Text('0:00', style: TextStyle(color: _muted, fontSize: 11)),
                ],
              ),
              const _DemoDataNotice(
                message:
                    'La reproducción en segundo plano requiere integrar el '
                    'reproductor y los archivos publicados.',
              ),
            ],
          ),
          const SizedBox(height: 14),
          _SettingsSection(
            title: 'Contenido sin conexión',
            icon: Icons.download_rounded,
            children: [
              const Text(
                'Paquete del atractivo: texto, imágenes y audioguía.',
                style: TextStyle(color: _muted),
              ),
              const SizedBox(height: 10),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: _isDownloaded
                      ? null
                      : () {
                          widget.onDownload();
                          setState(() => _isDownloaded = true);
                        },
                  icon: Icon(
                    _isDownloaded
                        ? Icons.check_circle_outline_rounded
                        : Icons.download_rounded,
                  ),
                  label: Text(
                    _isDownloaded
                        ? 'Paquete marcado en esta demostración'
                        : 'Simular descarga del paquete',
                  ),
                ),
              ),
              const _DemoDataNotice(
                message:
                    'No se descargan archivos todavía; esta selección solo '
                    'se conserva mientras la app está abierta.',
              ),
            ],
          ),
          const SizedBox(height: 14),
          _ReviewForm(
            controller: _reviewController,
            rating: _rating,
            reviews: _demoReviews,
            onRatingChanged: (rating) => setState(() => _rating = rating),
            onSubmit: _submitReview,
          ),
          const SizedBox(height: 18),
          const Text(
            'Información de muestra. El catálogo y las reseñas se conectarán '
            'a Supabase posteriormente.',
            textAlign: TextAlign.center,
            style: TextStyle(color: _muted, fontSize: 11),
          ),
        ],
      ),
    );
  }
}

class _ReviewForm extends StatelessWidget {
  const _ReviewForm({
    required this.controller,
    required this.rating,
    required this.reviews,
    required this.onRatingChanged,
    required this.onSubmit,
  });

  final TextEditingController controller;
  final int rating;
  final List<String> reviews;
  final ValueChanged<int> onRatingChanged;
  final VoidCallback onSubmit;

  @override
  Widget build(BuildContext context) {
    return _SettingsSection(
      title: 'Reseñas',
      icon: Icons.rate_review_outlined,
      children: [
        const Text(
          '¿Cómo fue tu visita?',
          style: TextStyle(color: _charcoal, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 5),
        Row(
          children: List.generate(
            5,
            (index) => IconButton(
              tooltip: 'Calificar ${index + 1} de 5',
              visualDensity: VisualDensity.compact,
              onPressed: () => onRatingChanged(index + 1),
              icon: Icon(
                index < rating
                    ? Icons.star_rounded
                    : Icons.star_outline_rounded,
                color: _ochre,
              ),
            ),
          ),
        ),
        TextField(
          key: const Key('review-comment'),
          controller: controller,
          maxLines: 3,
          maxLength: 500,
          decoration: const InputDecoration(
            hintText: 'Comparte tu experiencia',
            border: OutlineInputBorder(),
            alignLabelWithHint: true,
          ),
        ),
        SizedBox(
          width: double.infinity,
          child: FilledButton.icon(
            onPressed: onSubmit,
            icon: const Icon(Icons.send_rounded),
            label: const Text('Enviar reseña de prueba'),
          ),
        ),
        const SizedBox(height: 6),
        const _DemoDataNotice(
          message:
              'Las reseñas no se publican ni se envían a un servidor en esta '
              'demostración.',
        ),
        if (reviews.isNotEmpty) ...[
          const SizedBox(height: 13),
          const Divider(),
          for (final review in reviews)
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const CircleAvatar(
                backgroundColor: _sand,
                child: Icon(Icons.person_outline, color: _clayDark),
              ),
              title: Text(review),
              subtitle: const Text('Vista previa local'),
            ),
        ],
      ],
    );
  }
}

const _eyebrowStyle = TextStyle(
  color: _clay,
  fontSize: 11,
  fontWeight: FontWeight.w800,
  letterSpacing: 1.3,
);

IconData _categoryIcon(String category) => switch (category) {
  'Arqueología' => Icons.account_balance_rounded,
  'Historia' => Icons.history_edu_rounded,
  'Arquitectura' => Icons.church_rounded,
  _ => Icons.place_rounded,
};

String _formatDistance(double distanceKm) => distanceKm < 1
    ? '${(distanceKm * 1000).round()} m de ti'
    : '${distanceKm.toStringAsFixed(1)} km de ti';
