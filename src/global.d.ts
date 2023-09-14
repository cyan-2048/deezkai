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

interface MoveOrCopyOptions {
	keepBoth: boolean;
	targetStorage: DeviceStorage;
}

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

interface MozActivityOptions {
	name: string;
	data?: any;
}

interface MozActivityRequestHandler {
	readonly source: MozActivityOptions;
	postResult(data: any): void;
	postError(error: Error | string): void;
}

type respectTimezoneOptions = "ignoreTimezone" | "honorTimezone";

interface mozAlarm {
	id: number;
	date: Date;
	respectTimezone: respectTimezoneOptions;
	data?: any;
}

interface MozAlarmsManager {
	add(date: Date, respectTimezone: respectTimezoneOptions, data?: any): DOMRequest<mozAlarm>;
	remove(id: number): void;
	getAll(): DOMRequest<mozAlarm[]>;
}

function mozSetMessageHandler(type: "activity", handler: (request: MozActivityRequestHandler) => void): void;
function mozSetMessageHandler(type: "alarm", handler: (request: mozAlarm) => void): void;
function mozSetMessageHandler(type: string, handler: (request: unknown) => void): void;

declare global {
	interface Navigator {
		volumeManager: VolumeManager;
		getDeviceStorage(deviceStorage: ValidDeviceStorages): DeviceStorage;

		/**
		 * the function is basically just:
		 * ```JS
		 * function (name, type) {
		 * 	const storages = navigator.getDeviceStorages(type);
		 * 	return storages.find(storage => name === storage.storageName) || null;
		 * }
		 * ```
		 * @param name `DeviceStorage.storageName`
		 * @param type `navigator.getDeviceStorages(type)`
		 */
		getDeviceStorageByNameAndType(name: string, type: ValidDeviceStorages): DeviceStorage | null;
		mozApps: DOMApplicationsRegistry;
		mozAlarms: MozAlarmsManager;
		mozSetMessageHandler: typeof mozSetMessageHandler;
	}

	interface VolumeManager {
		requestShow(): void;
		requestUp(): void;
		requestDown(): void;
	}

	interface DOMRequest<T> extends EventTarget {
		readonly error?: Error;
		readonly result: T;
		onsuccess: () => void;
		onerror: () => void;
		readonly then: Promise<T>["then"];
		readonly readyState: "done" | "pending";
	}

	interface DOMCursor<T> extends EventTarget {
		readonly error?: Error;
		readonly result: T;
		onsuccess: () => void;
		onerror: () => void;
		readonly done: boolean;
		readonly readyState: "done" | "pending";
		readonly continue(): void;
	}

	interface HTMLMediaElement {
		mozAudioChannelType: "normal" | "content";
	}

	class MozActivity<T = any> extends DOMRequest<T> {
		constructor(options: MozActivityOptions): MozActivity;
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
		 * removes a file/folder
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
		 * copies a file to a destination
		 * warning: did not test method for edge cases (e.g. copy to same folder, wrong directory)
		 * @param filepath relative file path
		 * @param relativeDirectoryPath relative folder path in relation to the root of the provided targetStorage
		 * @param options required options
		 */
		copyTo(filepath: string, relativeDirectoryPath: string, options: MoveOrCopyOptions): Promise<boolean>;
		/**
		 * moves a file to a destination
		 * warning: did not test method for edge cases (e.g. move to same folder or wrong directory)
		 * @param filepath relative file path
		 * @param relativeDirectoryPath relative folder path in relation to the root of the provided targetStorage
		 * @param options required options
		 */
		moveTo(filepath: string, relativeDirectoryPath: string, options: MoveOrCopyOptions): Promise<boolean>;
	}

	interface DeviceStorage {
		storageName: string;
		get(filePath: string): DOMRequest<File>;
		addNamed(file: File | Blob, filePath: string): DOMRequest<File>;
		appendNamed(file: File | Blob, filePath: string): DOMRequest<File>;
		delete(filePath: string): DOMRequest<void>;
		enumerate(path?: string, options?: { since: Date }): DOMCursor<File>;
		getRoot(): Promise<Directory>;
		freeSpace(): DOMRequest<number>;
		usedSpace(): DOMRequest<number>;
	}

	class XMLHttpRequest {
		constructor(options?: { mozSystem?: boolean; mozAnon?: boolean }): XMLHttpRequest;
	}
}

export {};
