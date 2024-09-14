import { BaseException } from '@logic/exception.base';
import { Either, Option, pipe } from '@logic/fp';
import { DomainModel } from '@model/domain-model.base.type';

export interface DataMapper<DM extends DomainModel, DataModel> {
  toDomain(data: DataModel): Either.Either<BaseException, DM>;
  toData(params: {
    domainModel: DM;
    initState: Option.Option<DataModel>;
  }): Either.Either<BaseException, DataModel>;
}

export interface ToDataFactoryParams<DM extends DomainModel, DataModel> {
  initDataModel(domainModelIns: DM): Either.Either<BaseException, DataModel>;
  updateDataModel(params: {
    domainModel: DM;
    initState: DataModel;
  }): Either.Either<BaseException, DataModel>;
}

export const factoryToData =
  <DM extends DomainModel, DataModel>(
    params: ToDataFactoryParams<DM, DataModel>,
  ): DataMapper<DM, DataModel>['toData'] =>
  (mapperParams) => {
    return pipe(
      mapperParams.initState,
      Option.match(
        () => params.initDataModel(mapperParams.domainModel),
        (state) =>
          params.updateDataModel({
            domainModel: mapperParams.domainModel,
            initState: state,
          }),
      ),
    );
  };
