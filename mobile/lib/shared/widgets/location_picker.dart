import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:http/http.dart' as http;
import 'package:latlong2/latlong.dart';
import 'package:location/location.dart';
import 'package:sanjeevani/config/theme/app_theme.dart';

/// A reusable map widget that lets the user pick a location by tapping,
/// searching by address, or using GPS.
///
/// Returns the selected [LatLng] via [onLocationPicked].
class LocationPickerWidget extends StatefulWidget {
  final LatLng? initialLocation;
  final ValueChanged<LatLng> onLocationPicked;
  final double height;

  const LocationPickerWidget({
    super.key,
    this.initialLocation,
    required this.onLocationPicked,
    this.height = 250,
  });

  @override
  State<LocationPickerWidget> createState() => _LocationPickerWidgetState();
}

class _LocationPickerWidgetState extends State<LocationPickerWidget> {
  final MapController _mapController = MapController();
  final Location _location = Location();
  final TextEditingController _searchController = TextEditingController();

  LatLng? _pickedLocation;
  bool _isLoadingLocation = false;
  bool _isSearching = false;
  String? _errorMessage;
  List<_SearchResult> _searchResults = [];
  Timer? _debounce;

  // Default: Kathmandu, Nepal
  static const LatLng _defaultCenter = LatLng(27.7172, 85.3240);

  @override
  void initState() {
    super.initState();
    _pickedLocation = widget.initialLocation;
    _requestAndMoveToCurrentLocation();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _debounce?.cancel();
    _mapController.dispose();
    super.dispose();
  }

  // ── GPS location ───────────────────────────────────────

  Future<void> _requestAndMoveToCurrentLocation() async {
    setState(() {
      _isLoadingLocation = true;
      _errorMessage = null;
    });

    try {
      bool serviceEnabled = await _location.serviceEnabled();
      if (!serviceEnabled) {
        serviceEnabled = await _location.requestService();
        if (!serviceEnabled) {
          setState(() {
            _errorMessage =
                'Location services are disabled. Tap the map to pick manually.';
            _isLoadingLocation = false;
          });
          return;
        }
      }

      PermissionStatus permission = await _location.hasPermission();
      if (permission == PermissionStatus.denied) {
        permission = await _location.requestPermission();
        if (permission != PermissionStatus.granted &&
            permission != PermissionStatus.grantedLimited) {
          setState(() {
            _errorMessage =
                'Location permission denied. Tap the map to pick manually.';
            _isLoadingLocation = false;
          });
          return;
        }
      }

      final locationData = await _location.getLocation().timeout(
        const Duration(seconds: 10),
        onTimeout: () => throw Exception('Location request timed out'),
      );
      if (locationData.latitude != null && locationData.longitude != null) {
        final currentPos = LatLng(
          locationData.latitude!,
          locationData.longitude!,
        );
        if (mounted) {
          setState(() {
            if (_pickedLocation == null) {
              _pickedLocation = currentPos;
              widget.onLocationPicked(currentPos);
            }
          });
          _mapController.move(_pickedLocation ?? currentPos, 15.0);
        }
      }
    } catch (e) {
      debugPrint('LocationPicker error: $e');
      if (mounted) {
        setState(
          () => _errorMessage =
              'Could not get location. Tap the map to pick manually.',
        );
      }
    } finally {
      if (mounted) setState(() => _isLoadingLocation = false);
    }
  }

  // ── Search (Nominatim) ─────────────────────────────────

  void _onSearchChanged(String query) {
    _debounce?.cancel();
    if (query.trim().length < 3) {
      setState(() => _searchResults = []);
      return;
    }
    _debounce = Timer(const Duration(milliseconds: 500), () {
      _searchPlace(query.trim());
    });
  }

  Future<void> _searchPlace(String query) async {
    setState(() => _isSearching = true);
    try {
      final uri = Uri.parse(
        'https://nominatim.openstreetmap.org/search'
        '?q=${Uri.encodeComponent(query)}'
        '&format=json&addressdetails=1&limit=5',
      );
      final response = await http.get(
        uri,
        headers: {'User-Agent': 'sanjeevani-app/1.0'},
      );
      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        if (mounted) {
          setState(() {
            _searchResults = data
                .map(
                  (item) => _SearchResult(
                    displayName: item['display_name'] as String,
                    lat: double.parse(item['lat'] as String),
                    lon: double.parse(item['lon'] as String),
                  ),
                )
                .toList();
          });
        }
      }
    } catch (e) {
      debugPrint('Search error: $e');
    } finally {
      if (mounted) setState(() => _isSearching = false);
    }
  }

  void _selectSearchResult(_SearchResult result) {
    final point = LatLng(result.lat, result.lon);
    setState(() {
      _pickedLocation = point;
      _searchResults = [];
      _searchController.text = result.displayName;
    });
    widget.onLocationPicked(point);
    _mapController.move(point, 15.0);
    FocusScope.of(context).unfocus();
  }

  // ── Map tap ────────────────────────────────────────────

  void _handleTap(TapPosition tapPosition, LatLng point) {
    setState(() {
      _pickedLocation = point;
      _searchResults = [];
    });
    widget.onLocationPicked(point);
  }

  // ── Build ──────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Label row
        Row(
          children: [
            const Text(
              'Pharmacy Location',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(width: 4),
            const Text('*', style: TextStyle(color: AppColors.error)),
            const Spacer(),
            if (_isLoadingLocation)
              const SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            else
              GestureDetector(
                onTap: _requestAndMoveToCurrentLocation,
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.my_location, size: 16, color: AppColors.primary),
                    SizedBox(width: 4),
                    Text(
                      'My Location',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.primary,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
        const SizedBox(height: 8),

        // ── Search field ─────────────────────────────
        _LocationSearchField(
          controller: _searchController,
          isSearching: _isSearching,
          onChanged: _onSearchChanged,
          onClear: () {
            _searchController.clear();
            setState(() => _searchResults = []);
          },
        ),

        // ── Search results dropdown ──────────────────
        if (_searchResults.isNotEmpty)
          _SearchResultsList(
            results: _searchResults,
            onSelect: _selectSearchResult,
          ),

        const SizedBox(height: 8),

        // Map
        ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: Container(
            height: widget.height,
            decoration: BoxDecoration(
              border: Border.all(color: AppColors.border),
              borderRadius: BorderRadius.circular(12),
            ),
            child: FlutterMap(
              mapController: _mapController,
              options: MapOptions(
                initialCenter: widget.initialLocation ?? _defaultCenter,
                initialZoom: 13.0,
                onTap: _handleTap,
              ),
              children: [
                TileLayer(
                  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                  userAgentPackageName: 'com.sanjeevani.app',
                ),
                if (_pickedLocation != null)
                  MarkerLayer(
                    markers: [
                      Marker(
                        point: _pickedLocation!,
                        width: 40,
                        height: 40,
                        child: const Icon(
                          Icons.location_pin,
                          color: AppColors.accent,
                          size: 40,
                        ),
                      ),
                    ],
                  ),
              ],
            ),
          ),
        ),

        if (_errorMessage != null) ...[
          const SizedBox(height: 6),
          Text(
            _errorMessage!,
            style: const TextStyle(fontSize: 12, color: AppColors.error),
          ),
        ],

        // Coordinates display
        if (_pickedLocation != null) ...[
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.06),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                const Icon(Icons.pin_drop, size: 16, color: AppColors.primary),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    '${_pickedLocation!.latitude.toStringAsFixed(6)}, ${_pickedLocation!.longitude.toStringAsFixed(6)}',
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}

// ── Private helper widgets & models ──────────────────────

class _SearchResult {
  final String displayName;
  final double lat;
  final double lon;

  const _SearchResult({
    required this.displayName,
    required this.lat,
    required this.lon,
  });
}

/// Search text field shown above the map.
class _LocationSearchField extends StatelessWidget {
  final TextEditingController controller;
  final bool isSearching;
  final ValueChanged<String> onChanged;
  final VoidCallback onClear;

  const _LocationSearchField({
    required this.controller,
    required this.isSearching,
    required this.onChanged,
    required this.onClear,
  });

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      onChanged: onChanged,
      style: const TextStyle(fontSize: 14),
      decoration: InputDecoration(
        hintText: 'Search location...',
        prefixIcon: const Icon(Icons.search, size: 20),
        suffixIcon: isSearching
            ? const Padding(
                padding: EdgeInsets.all(12),
                child: SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              )
            : controller.text.isNotEmpty
            ? IconButton(
                icon: const Icon(Icons.close, size: 18),
                onPressed: onClear,
              )
            : null,
        filled: true,
        fillColor: Colors.white,
        isDense: true,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 14,
          vertical: 12,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
        ),
      ),
    );
  }
}

/// Dropdown list of search results.
class _SearchResultsList extends StatelessWidget {
  final List<_SearchResult> results;
  final ValueChanged<_SearchResult> onSelect;

  const _SearchResultsList({required this.results, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(top: 4),
      constraints: const BoxConstraints(maxHeight: 180),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ListView.separated(
        padding: EdgeInsets.zero,
        shrinkWrap: true,
        itemCount: results.length,
        separatorBuilder: (_, __) =>
            const Divider(height: 1, color: AppColors.border),
        itemBuilder: (context, index) {
          final r = results[index];
          return InkWell(
            onTap: () => onSelect(r),
            borderRadius: BorderRadius.circular(
              index == 0
                  ? 12
                  : index == results.length - 1
                  ? 12
                  : 0,
            ),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              child: Row(
                children: [
                  const Icon(
                    Icons.location_on_outlined,
                    size: 18,
                    color: AppColors.primary,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      r.displayName,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
