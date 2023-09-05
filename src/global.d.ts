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
		Directory: typeof Directory;
		VolumeManager: VolumeManager;
	}

	interface VolumeManager {
		requestShow: () => void;
		requestUp: () => void;
		requestDown: () => void;
	}

	interface DOMRequest<T> extends EventTarget {
		error?: Error;
		result: T;
		onsuccess(): void;
		onerror(): void;
		then: Promise<T>["then"];
	}

	class MozActivity extends DOMRequest<any> {
		constructor(options: MozActivityOptions): MozActivity;
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

		/**
		 * @deprecated UNKNOWN METHOD
		 */
		addReceipt(): unknown;
		/**
		 * @deprecated UNKNOWN METHOD
		 */
		checkForUpdate(): unknown;
		/**
		 * @deprecated UNKNOWN METHOD
		 */
		removeReceipt(): unknown;
		/**
		 * @deprecated UNKNOWN METHOD
		 */
		replaceReceipt(): unknown;
	}

	class Directory {
		/**
		 * name of the current folder
		 */
		name: string;

		/**
		 * the filepath of the folder relative to the root
		 */
		path: string;

		/**
		 * creates a file to a filepath (creates folders if necessary), the created file will be an empty Blob
		 * @param filepath relative file path
		 */
		createFile(filepath: string): Promise<boolean>;
		/**
		 * creates a folder to a filepath (creates folders if necessary)
		 * @param filepath relative file path
		 */
		createDirectory(filepath: string): Promise<boolean>;

		/**
		 * get the file, creates a folder if it doesn't exist
		 * @param filepath relative file path
		 */
		get(filepath: string): Promise<File>;

		/**
		 * removes a file/folder, throws Exeception if the folder has content
		 * @param filepath relative file path
		 * @returns true if the file/folder was removed, false if it didn't exist
		 */
		remove(filepath: string): Promise<boolean>;
		/**
		 * removes a file/folder, throws Exeception if the folder has content
		 * @param filepath relative file path
		 * @returns true if the file/folder was removed, false if it didn't exist
		 */
		removeDeep(filepath: string): Promise<boolean>;

		/**
		 * Renames a file or folder, relative file path
		 * @param filepath relative file path
		 * @param newName new name of the file or folder
		 */
		renameTo(filepath: string, newName: string): Promise<boolean>;
		getFilesAndDirectories(): Promise<Array<File | Directory>>;
		getFiles(): Promise<File[]>;

		/**
		 * @deprecated UNKNOWN METHOD
		 */
		copyTo(): unknown;
		/**
		 * @deprecated UNKNOWN METHOD
		 */
		moveTo(): unknown;
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
		constructor(options?: { mozSystem?: boolean; mozAnon?: boolean }): XMLHttpRequest;
	}
}

export {};
