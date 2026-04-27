import Foundation

private struct APIErrorBody: Decodable {
    let error: String
}

final class APIClient {
    static let shared = APIClient()

    private let baseURL: String
    private let apiKey: String
    private let decoder: JSONDecoder = {
        let d = JSONDecoder()
        d.dateDecodingStrategy = .iso8601
        return d
    }()

    private init() {
        guard
            let url = Bundle.main.object(forInfoDictionaryKey: "API_BASE_URL") as? String,
            let key = Bundle.main.object(forInfoDictionaryKey: "API_KEY") as? String
        else { fatalError("API_BASE_URL and API_KEY must be set in Info.plist") }
        self.baseURL = url
        self.apiKey  = key
    }

    func get<T: Decodable>(_ path: String) async throws -> T {
        try await request(path: path, method: "GET", body: nil as Data?)
    }

    func post<B: Encodable, T: Decodable>(_ path: String, body: B) async throws -> T {
        let data = try JSONEncoder().encode(body)
        return try await request(path: path, method: "POST", body: data)
    }

    func patch<B: Encodable, T: Decodable>(_ path: String, body: B) async throws -> T {
        let data = try JSONEncoder().encode(body)
        return try await request(path: path, method: "PATCH", body: data)
    }

    func patchAny<T: Decodable>(_ path: String, body: [String: Any]) async throws -> T {
        let data = try JSONSerialization.data(withJSONObject: body)
        return try await request(path: path, method: "PATCH", body: data)
    }

    func deleteVoid(_ path: String, body: [String: Any]) async throws {
        let data = try JSONSerialization.data(withJSONObject: body)
        try await requestVoid(path: path, method: "DELETE", body: data)
    }

    private func requestVoid(path: String, method: String, body: Data?) async throws {
        guard let url = URL(string: baseURL + path) else { throw APIError.invalidURL }
        var req = URLRequest(url: url)
        req.httpMethod = method
        req.setValue(apiKey, forHTTPHeaderField: "x-api-key")
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = body
        let (data, response) = try await URLSession.shared.data(for: req)
        guard let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
            let message = try? decoder.decode(APIErrorBody.self, from: data).error
            throw APIError.httpError((response as? HTTPURLResponse)?.statusCode ?? 0, message)
        }
    }

    private func request<T: Decodable>(path: String, method: String, body: Data?) async throws -> T {
        guard let url = URL(string: baseURL + path) else { throw APIError.invalidURL }
        var req = URLRequest(url: url)
        req.httpMethod = method
        req.setValue(apiKey, forHTTPHeaderField: "x-api-key")
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = body

        let (data, response) = try await URLSession.shared.data(for: req)
        guard let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
            let message = try? decoder.decode(APIErrorBody.self, from: data).error
            throw APIError.httpError((response as? HTTPURLResponse)?.statusCode ?? 0, message)
        }
        return try decoder.decode(T.self, from: data)
    }
}

enum APIError: LocalizedError {
    case invalidURL
    case httpError(Int, String?)

    var errorDescription: String? {
        switch self {
        case .invalidURL:      return "Invalid URL"
        case .httpError(let c, let message): return message ?? "Server error \(c)"
        }
    }
}
