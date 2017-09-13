(function () {
    'use strict';

    angular
        .module('app.pages.mySlap')
        .controller('mySlapController', mySlapController);

    function mySlapController($scope, $rootScope, pageService,stepService, $state, userService, idealclientService, actionplanService, activityService) {

        angular.extend($scope,{
            model: {
                clients: []
            },
            data: {},
            defaultStrategies: actionplanService.getDefaultConnectingStrategies(),
            privilegesData: {
                second: ['providing', 'creating', 'giving', 'helping']
            },
            fifth: ['Market size', 'Local', 'Regional', 'National', 'Global'],
            gender: ['Empty', 'Male', 'Female'],
            maritalStatus: ['Empty', 'Single', 'Married', 'Divorced', 'Widowed'],
            kids: ['Empty', 'None', 'Young', 'Teens',' Adults'],
            employment: ['Empty', 'Doesn’t Work Established Entrepreneur', 'Small Entrepreneur', 'Senior Employed', 'Mid Level Employed', 'Junior Employed'],
            location: ['Empty', 'City', 'Suburbs', 'Rural', 'Other'],
            home: ['Empty', 'Condo', 'Apartment', 'House', 'Farm', 'Other'],
            transit: ['Empty', 'Car', 'Bike', 'Train', 'Walking', 'Planes', 'Other'],
            forward: true,
            sendData: sendData,

            age: ['Age','11-20','21-30','31-40','41-50','51-60','61-70','71-80','81-90'],
            hobbies: ['Hobbies', 'Volunteering',  'Working Out', 'Shopping',  'Traveling',   'Sports',  'Reading',  'Arts & Culture'],
            reads: ['Reads', 'Business Book', 'Self Help Book', 'Magazine', 'Novel', 'Blog Posts',  'Newspaper'],
            
            months: ['','January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
            monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            totalFixedExpenses: '0.00',
            totalTarget: '0.00',

            quaters:[],
            QMonths: [],
            getStrategyName: getStrategyName
        });
        
        getData();
        
        pageService
            .reset()
            .setShowBC(false)
            .addCrumb({name: 'Dashboard', path: 'home'})
            .setPageTitle('Ideal Client');

        function sendData(direction) {
            stepService.updateActiveModel($scope);
            if(stepService.setFinishActiveStep())
                userService.loadUser().then(function(me){
                    activityService.add({
                        userId: me._id,
                        title: 'Step4 Done',
                        type: 'Milestone',  
                        notes: me.businessName + ' finished building Step4.',
                        journey: {section: 'build', name: 'Step4 Done'}})
                        .then(function(){});    
                });
            var nextprevStep = stepService.getNextAndPrevStep();

            if(direction == 'forward')
				$state.go(nextprevStep.nextStep.sref); 
            else if(direction == 'backward')
				$state.go(nextprevStep.prevStep.sref);
        }


        function getData() {

            stepService.getApiData('yourStatement')  //TODO: request api? data service
                .then(function (response) {
                    if (response && response.status === 200) {

                        angular.extend($scope.model, {
                            stepOneSummary: _.get(response, 'data.yourStatement', {})
                        });
                        
                        userService.getUser().then(function (user) {
                            $scope.data.businessName = user.businessName;
                        });
                    }
                });

            stepService.getApiData('allMindsetUser') //TODO: Think over the dynamics url
                .then(function (response) {
                    if (response && response.status === 200) {
                        angular.extend($scope.data, {
                            privilegeInfo: _.get(response, 'data.privilegeAndResponsibility', {})
                        });

                        $scope.slapStartDate = _.get(response, 'data.slapStartDate', []);
                    }
                });

            stepService.getApiData('whoAreYouIdealClient')  //TODO: request api? data service
                .then(function (response) {
                    if (response && response.status === 200) {
                        $scope.model.clients = _.get(response, 'data.whoAreYouIdealClient', []);
                        $scope.client = idealclientService.calcIdealClient($scope.model.clients);
                    }
                });
                
            stepService.getApiData('revenueStreams')  //TODO: request api? data service
                .then(function (response) {
                    if (response && response.status === 200) {
                        $scope.model.revenues = _.get(response, 'data.revenueStreams.revenues', []);
                        $scope.totalTarget = 0;
                        _.each($scope.model.revenues, function(revenue){
                             $scope.totalTarget += (+revenue.sellingPrice * +revenue.unit);
                        })

                    }
                });


            stepService.getApiData('fixedBusinessExpenses')  //TODO: request api? data service
                .then(function (response) {
                    if (response && response.status === 200) {
                        $scope.totalFixedExpenses = (response.data.fixedBusinessExpenses.expensesSum + response.data.fixedBusinessExpenses.incidentals * 0.01 * response.data.fixedBusinessExpenses.expensesSum) * 12  + (+response.data.fixedBusinessExpenses.profit);

                        $scope.profit = response.data.fixedBusinessExpenses.profit;
                    }
                });



            stepService.getApiData('whatsHappening')  //TODO: request api? data service
                .then(function (response) {
                    if (response && response.status === 200) {
                        $scope.quaters = response.data.whatsHappening;
                    }
                });

            var url = 'allMindsetUser';


            return stepService.getApiData(url)
                .then(function (response) {
                    if (response && response.status === 200) {

                        $scope.startDate = response.data.slapStartDate;
                        $scope.QMonths.push( actionplanService.getNthQuaterMonths ($scope.startDate.month, 1));
                        $scope.QMonths.push( actionplanService.getNthQuaterMonths($scope.startDate.month, 2));
                        $scope.QMonths.push( actionplanService.getNthQuaterMonths($scope.startDate.month, 3));
                        $scope.QMonths.push( actionplanService.getNthQuaterMonths($scope.startDate.month, 4));
                    }
                });
        }
        $scope.$on('$stateChangeStart', function (event, toState, toStateParams) {
            sendData();
        });


        $scope.state = stepService.goState;

        function getStrategyName(id) {
            var obj = _.find($scope.defaultStrategies, {id: id});
            if (obj) return obj.name;
            else return ''
        }
        
        $scope.printSlap = function () {
            window.print();
        };

        var vm = this;
        
            $rootScope.$on('SlapAccounUpdated', function (event, user) {
                vm.user = user;
            });

            userService.getUser().then(function (user) {
                    vm.user = user;
            });

            this.logout = function () {
                $auth.logout();
                $window.location.reload();
                $state.go('login');
            }
            
            this.selectSLAPyear = function(user) {
                if(user._id == vm.user._id)
                    return;

                userService.selectSLAPyear(user._id)
                .then(function(req){
                    $auth.setToken(req.data.token);
                    $window.location.reload();
                    $state.go('home');

                })

            }
    }
}());