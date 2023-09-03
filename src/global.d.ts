class DOMApplicationsRegistry {
	install(): unknown;
	installPackage(): unknown;
	getSelf(): DOMRequest<DOMApplication>;
	getInstalled(): unknown;
	checkInstalled(): unknown;
	getAdditionalLanguages(): unknown;
	getLocalizationResource(): unknown;
}

type AccessDescription = Partial<{
	description: string;
	access: "readonly" | "readwrite" | "readcreate" | "createonly";
}>;

type AccessDescriptionRecord = Record<string, AccessDescription>;

type ManifestOptional = Partial<{
	short_name: string;
	bgs: Record<string, string>;
	launch_path: string;
	origin: string;
	permissions: AccessDescriptionRecord;
	type: "privileged" | "certified" | "web";
	fullscreen: "true" | "false";
	"datastores-owned": AccessDescriptionRecord;
	"datastores-access": AccessDescriptionRecord;
	messages: Array<Record<string, string>>;
	redirects: { from: string; to: string }[];
	activities: Record<
		string,
		Partial<{
			filters: {
				type: string[];
			};
			href: string;
			disposition: "window" | "inline";
			returnValue: boolean;
		}>
	>;
	precompile: string[];
	orientation: ("portrait" | "landscape" | "portrait-primary" | "landscape-primary" | "portrait-secondary" | "landscape-secondary")[];
	csp: string;
}>;

interface Manifest extends ManifestOptional {
	name: string;
	version: string;
	description: string;
	icons: Record<string, string>;
	developer: { name: string; url?: string };
	locales: Record<string, { name: string; description: string }>;
	default_locale: string;
	subtitle: string;
	categories: ("social" | "games" | "utilities" | "life style" | "entertainment" | "health" | "sports" | "book/reference")[];
}

declare global {
	interface Navigator {
		volumeManager: VolumeManager;
		getDeviceStorage: (deviceStorage: ValidDeviceStorages) => DeviceStorage;
		getDeviceStorageByNameAndType: (name: string, type: ValidDeviceStorages) => DeviceStorage;
		mozApps: DOMApplicationsRegistry;
	}

	interface Window {
		MozActivity: MozActivity;
	}

	interface VolumeManager {
		requestShow: () => void;
		requestUp: () => void;
		requestDown: () => void;
	}

	interface DOMRequest<T> {
		error?: Error;
		result: T;
		onsuccess(): void;
		onerror(): void;
		then: Promise<T>["then"];
	}

	class MozActivity {
		constructor(options: MozActivityOptions): MozActivity;
		onerror?: (error: any) => void;
	}

	interface MozActivityOptions {
		name: string;
		data?: any;
	}

	type ValidDeviceStorages = "apps" | "music" | "pictures" | "videos" | "sdcard";

	class DOMApplication {
		manifest: Manifest;
		manifestURL: string;
		origin: string;
		installOrigin: string;
		installTime: number;
		receipts: object[] | null;

		launch(): void;

		addReceipt(): unknown;
		checkForUpdate(): unknown;
		removeReceipt(): unknown;
		replaceReceipt(): unknown;
	}

	class Directory {
		name: string;
		path: string;

		createFile(): unknown;
		createDirectory(): unknown;
		get(): unknown;
		remove(): unknown;
		removeDeep(): unknown;
		copyTo(): unknown;
		moveTo(): unknown;
		renameTo(): unknown;
		getFilesAndDirectories(): Promise<File | Directory>;
		getFiles(): Promise<File>;
	}

	interface DeviceStorage {
		storageName: string;
		get: (filePath: string) => DOMRequest<File>;
		addNamed: (file: File | Blob, filePath: string) => DOMRequest<File>;
		appendNamed: (file: File | Blob, filePath: string) => DOMRequest<File>;
		delete: (filePath: string) => DOMRequest<void>;
		enumerate: any;
		getRoot: () => Promise<Directory>;
	}

	class XMLHttpRequest {
		constructor(options: undefined | { mozSystem?: boolean }): XMLHttpRequest;
	}
}

export {};
