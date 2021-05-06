/**
 * The typ of a function
 */
export enum FunctionType {
    /**
     * A normal function
     */
    Standard,
    /**
     * A trigger function of a field or an object for example
     */
    Trigger,
    /**
     * A object internal event function
     */
    InternalEvent,
    /**
     * A microsoft business event function
     */
    BusinessEvent,
    /**
     * A integration event function
     */
    IntegrationEvent,
    /**
     * A event subscriber function
     */
    EventSubscriber
}